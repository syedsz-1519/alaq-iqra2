import { shareImage } from "@/lib/share";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Ear, Loader2, Mic, RotateCcw, Snail, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { getTeacher } from "@/lib/teachers";
import { cachedJson, playableUrl } from "@/lib/offline-cache";
import { checkPhrase } from "@/lib/phrase.functions";
import { PASS_SCORE, ayahWordsUrl, parseAyahWords, splitPhrases, type PhraseWord } from "@/lib/phrases";
import { audioUrl, reciterForSurah, surahListQuery, DEFAULT_SETTINGS, type Settings } from "@/lib/quran";
import { KEYS, useStored } from "@/lib/storage";
import { ErrorNotice } from "@/components/alaq/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const wordsQuery = (surah: number, ayah: number) =>
  queryOptions({
    queryKey: ["wbw", surah, ayah],
    staleTime: Infinity,
    queryFn: async () => parseAyahWords(await cachedJson<unknown>(ayahWordsUrl(surah, ayah))),
  });

export const Route = createFileRoute("/repeat")({
  validateSearch: z.object({
    surah: z.coerce.number().int().min(1).max(114).catch(1),
    ayah: z.coerce.number().int().min(1).max(286).catch(1),
  }),
  loaderDeps: ({ search }) => ({ surah: search.surah, ayah: search.ayah }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(wordsQuery(deps.surah, deps.ayah)),
  head: ({ match }) => ({
    meta: [
      { title: "Repeat after your teacher — learn each ayah phrase by phrase | Alaq" },
      { name: "description", content: "Hear each Quran ayah in short phrases, repeat it aloud, and Zaid or Zara gently checks your recitation until you get it right." },
      { property: "og:title", content: "Repeat after your teacher — Alaq" },
      { property: "og:description", content: "Learn to recite the Quran phrase by phrase with instant checking." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  errorComponent: ({ reset }) => <div className="mx-auto max-w-xl px-4 py-16"><ErrorNotice message="This ayah couldn't be loaded. Check your connection and try again." onRetry={reset} /></div>,
  component: RepeatPage,
});

type Result = { score: number; passed: boolean; heard: string; missing: string[] };

async function blobToBase64(b: Blob) {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function RepeatPage() {
  const { surah, ayah } = Route.useSearch();
  const navigate = useNavigate({ from: "/repeat" });
  const { user, teacher: teacherId } = useAuth();
  const tName = getTeacher(teacherId).name;
  const { data: words } = useSuspenseQuery(wordsQuery(surah, ayah));
  const surahs = useQuery(surahListQuery());
  const [settings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const meta = surahs.data?.find((s) => s.number === surah);
  const phrases = useMemo(() => splitPhrases(words), [words]);
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stopPlay = useRef(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setIndex(0);
    setPassed(new Set());
    setResult(null);
    setAttempts(0);
  }, [surah, ayah]);
  useEffect(() => () => {
    stopPlay.current = true;
    audio.current?.pause();
  }, []);

  const p = phrases[index];
  const pw: PhraseWord[] = p ? words.slice(p.start, p.end + 1) : [];
  const allDone = phrases.length > 0 && passed.size === phrases.length;

  const playUrls = async (urls: string[], rate = 1) => {
    stopPlay.current = false;
    audio.current?.pause();
    setPlaying(true);
    try {
      for (const u of urls) {
        if (stopPlay.current) break;
        const el = new Audio(await playableUrl(u));
        el.playbackRate = rate;
        audio.current = el;
        await new Promise<void>((resolve) => {
          el.onended = () => resolve();
          el.onerror = () => resolve();
          el.onpause = () => resolve();
          el.play().catch(() => resolve());
        });
      }
    } finally {
      setPlaying(false);
    }
  };
  const listen = (rate = 1) => {
    if (playing) {
      stopPlay.current = true;
      audio.current?.pause();
      return;
    }
    void playUrls(pw.map((w) => w.audio).filter((u): u is string => Boolean(u)), rate);
  };
  const listenAyah = () => void playUrls([audioUrl(reciterForSurah(settings, surah), surah, ayah)]);

  const record = async () => {
    if (recording) return rec.current?.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        setBusy(true);
        try {
          const res = await checkPhrase({ data: { surah, ayah, phrase: index, audio: await blobToBase64(blob), mime: blob.type } });
          setResult(res);
          setAttempts((a) => a + 1);
          if (res.passed) setPassed((s) => new Set(s).add(index));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `${tName} couldn't check that recording`);
        } finally {
          setBusy(false);
        }
      };
      rec.current = r;
      stopPlay.current = true;
      audio.current?.pause();
      r.start();
      setResult(null);
      setRecording(true);
      setTimeout(() => r.state === "recording" && r.stop(), 30_000);
    } catch {
      toast.error("Please allow microphone access to recite.");
    }
  };

  const goPhrase = (i: number) => {
    setIndex(i);
    setResult(null);
    setAttempts(0);
  };
  const goAyah = (delta: number) => {
    const max = meta?.numberOfAyahs ?? 286;
    let s = surah;
    let a = ayah + delta;
    if (a < 1) {
      if (s === 1) return;
      s -= 1;
      a = surahs.data?.find((x) => x.number === s)?.numberOfAyahs ?? 1;
    } else if (a > max) {
      if (s === 114) return;
      s += 1;
      a = 1;
    }
    void navigate({ search: { surah: s, ayah: a } });
  };
  const missing = new Set(result?.missing ?? []);
  const norm = (t: string) => t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[ٱأإآ]/g, "ا");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <section className="bg-hero relative overflow-hidden rounded-3xl p-6 text-night-foreground shadow-elegant">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Repeat after {tName}</p>
        <h1 className="mt-1 font-display text-3xl">Learn it phrase by phrase</h1>
        <p className="mt-1 text-sm opacity-80">Listen, repeat aloud, and {tName} gently checks each phrase until you have it right.</p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-xs opacity-80">
            Surah
            <select
              value={surah}
              onChange={(e) => void navigate({ search: { surah: Number(e.target.value), ayah: 1 } })}
              className="mt-1 block h-10 rounded-xl border border-night-foreground/20 bg-night px-2 text-sm text-night-foreground"
            >
              {(surahs.data ?? [{ number: surah, englishName: `Surah ${surah}`, name: "" }]).map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs opacity-80">
            Ayah
            <select
              value={ayah}
              onChange={(e) => void navigate({ search: { surah, ayah: Number(e.target.value) } })}
              className="mt-1 block h-10 rounded-xl border border-night-foreground/20 bg-night px-2 text-sm text-night-foreground"
            >
              {Array.from({ length: meta?.numberOfAyahs ?? ayah }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => goAyah(-1)} aria-label="Previous ayah" className="grid size-10 place-items-center rounded-full border border-night-foreground/20 hover:bg-night-foreground/10">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => goAyah(1)} aria-label="Next ayah" className="grid size-10 place-items-center rounded-full border border-night-foreground/20 hover:bg-night-foreground/10">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Whole ayah with phrase map */}
      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-elegant">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {meta?.englishName ?? `Surah ${surah}`} · Ayah {ayah} · {passed.size}/{phrases.length} phrases
          </span>
          <button type="button" onClick={listenAyah} className="inline-flex items-center gap-1 hover:text-foreground">
            <Volume2 className="size-3.5" /> Whole ayah
          </button>
        </div>
        <p dir="rtl" lang="ar" className="text-right text-2xl leading-[2.4]" style={{ fontFamily: "var(--font-arabic)" }}>
          {phrases.map((ph, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goPhrase(i)}
              className={cn(
                "mx-0.5 rounded-lg px-1 transition-colors",
                i === index ? "bg-gold/25 ring-1 ring-gold" : passed.has(i) ? "text-primary" : "hover:bg-secondary",
              )}
            >
              {words.slice(ph.start, ph.end + 1).map((w) => w.text).join(" ")}
            </button>
          ))}
        </p>
      </div>

      {/* Current phrase */}
      {p && (
        <div className="mt-5 rounded-3xl border border-border bg-card-gradient p-6 shadow-elegant">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Phrase {index + 1} of {phrases.length}
          </p>
          <p dir="rtl" lang="ar" className="mt-4 text-center text-4xl leading-[2] sm:text-5xl" style={{ fontFamily: "var(--font-arabic)" }}>
            {pw.map((w, i) => (
              <span key={i} className={cn("mx-1", result && missing.has(norm(w.text)) && "rounded-md bg-destructive/15 text-destructive")}>
                {w.text}
              </span>
            ))}
          </p>
          <p className="mt-3 text-center text-sm italic text-muted-foreground">{pw.map((w) => w.transliteration).join(" ")}</p>
          <p className="mt-1 text-center text-sm">{pw.map((w) => w.translation).join(" ")}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => listen(1)} className="rounded-full">
              {playing ? <Square className="size-4" /> : <Ear className="size-4" />} {playing ? "Stop" : "Listen"}
            </Button>
            <Button variant="outline" onClick={() => listen(0.7)} disabled={playing} className="rounded-full" aria-label="Listen slowly">
              <Snail className="size-4" /> Slow
            </Button>
            {user ? (
              <button
                type="button"
                onClick={record}
                disabled={busy}
                aria-label={recording ? "Stop and check" : "Record your recitation"}
                className={cn(
                  "relative inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold shadow-glow disabled:opacity-60",
                  recording ? "bg-destructive text-destructive-foreground" : "bg-gold-gradient text-gold-foreground",
                )}
              >
                {recording && <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-destructive" />}
                {busy ? <Loader2 className="size-4 animate-spin" /> : recording ? <Square className="size-4" /> : <Mic className="size-4" />}
                {busy ? "Checking…" : recording ? "Stop & check" : "Repeat aloud"}
              </button>
            ) : (
              <Link to="/auth" search={{ redirect: `/repeat?surah=${surah}&ayah=${ayah}` }} className="bg-gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold text-gold-foreground">
                <Mic className="size-4" /> Sign in to have {tName} check you
              </Link>
            )}
          </div>

          {result && (
            <div
              role="status"
              className={cn(
                "animate-fade-up mt-6 rounded-2xl border p-4 text-center",
                result.passed ? "border-primary/40 bg-accent text-accent-foreground" : "border-destructive/30 bg-destructive/10",
              )}
            >
              <p className="font-display text-2xl">{result.passed ? "Ma sha Allah — correct!" : "Almost — try once more"}</p>
              <p className="mt-1 text-sm opacity-80">
                {result.score}% of the words heard (pass is {PASS_SCORE}%) · attempt {attempts}
              </p>
              {!result.passed && result.missing.length > 0 && <p className="mt-2 text-sm">Listen again to the words marked in red, then repeat.</p>}
              {result.heard && (
                <p dir="rtl" className="mt-2 text-sm text-muted-foreground">
                  {tName} heard: {result.heard}
                </p>
              )}
              <div className="mt-4 flex justify-center gap-2">
                {!result.passed && (
                  <Button variant="outline" className="rounded-full" onClick={() => listen(0.7)}>
                    <RotateCcw className="size-4" /> Hear it slowly
                  </Button>
                )}
                {result.passed && index < phrases.length - 1 && (
                  <Button className="rounded-full" onClick={() => goPhrase(index + 1)}>
                    Next phrase <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {allDone && (
            <div className="mt-6 rounded-2xl bg-hero p-4 text-center text-night-foreground">
              <p className="flex items-center justify-center gap-2 font-display text-xl">
                <Check className="size-5 text-gold" /> You recited every phrase of this ayah
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Button variant="secondary" className="rounded-full" onClick={listenAyah}>
                  <Volume2 className="size-4" /> Hear the whole ayah
                </Button>
                <Button className="bg-gold-gradient rounded-full text-gold-foreground" onClick={() => goAyah(1)}>
                  Next ayah <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Arabic words, transliteration, meanings and word audio from{" "}
        <a href={`https://quran.com/${surah}/${ayah}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Quran.com
        </a>
        . Checking uses speech recognition and can miss small Tajweed details — a teacher's ear is still best.
      </p>
    </div>
  );
}
