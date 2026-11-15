import { shareImage } from "@/lib/share";
import { useAuth } from "@/lib/auth";
import { getTeacher } from "@/lib/teachers";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { ASSIGNMENTS, type Attempt } from "@/lib/assignments";
import { checkRecitation } from "@/lib/ai.functions";
import type { CheckResult } from "@/lib/ai.server";
import { RATING_LABEL, RUBRICS, rubricScore } from "@/lib/rubric";
import { TAJWEED_REMINDER, TAJWEED_SOURCE } from "@/lib/tajweed-notes";
import { useStored } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assignments")({
  head: ({ match }) => ({
    meta: [
      { title: "Voice Assignments — Recite to Zaid or Zara | Alaq" },
      { name: "description", content: "Recite short surahs and duas aloud and get gentle feedback from Zaid or Zara on Qalqalah, Ghunnah and accuracy." },
      { property: "og:title", content: "Voice Assignments — Alaq" },
      { property: "og:description", content: "Recite aloud and get a Qalqalah & Ghunnah review from your teacher." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: Assignments,
});

const LANG_OPTS = [["en", "English"], ["hi", "हिन्दी"], ["ur", "اردو"], ["roman", "Roman Urdu (Hyderabadi)"], ["te", "తెలుగు"], ["mr", "मराठी"]] as const;
type FeedbackLang = (typeof LANG_OPTS)[number][0];

async function blobToBase64(b: Blob) {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function Assignments() {
  const { teacher: teacherId } = useAuth();
  const tName = getTeacher(teacherId).name;
  const quran = ASSIGNMENTS.filter((a) => a.kind === "quran");
  const [selected, setSelected] = useState(quran[0]!.id);
  const [lang, setLang] = useStored<FeedbackLang>("alaq:feedback-lang", "en");
  const [history, setHistory] = useStored<Record<string, Attempt[]>>("alaq:assignments", {});
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const a = ASSIGNMENTS.find((x) => x.id === selected)!;

  const start = async () => {
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
          const res = await checkRecitation({ data: { assignmentId: a.id, audio: await blobToBase64(blob), mime: blob.type, feedbackLang: lang, teacher: teacherId } });
          setResult(res);
          setHistory((h) => ({
            ...h,
            [a.id]: [{ at: Date.now(), score: res.score, transcript: res.transcript, summary: res.summary, tips: res.tips, missing: res.missing }, ...(h[a.id] ?? [])].slice(0, 10),
          }));
          if (res.audio) void new Audio(`data:${res.mime};base64,${res.audio}`).play().catch(() => {});
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `${tName} couldn't check this recording`);
        } finally {
          setBusy(false);
        }
      };
      rec.current = r;
      r.start();
      setResult(null);
      setRecording(true);
      setTimeout(() => r.state === "recording" && r.stop(), 180_000);
    } catch {
      toast.error("Please allow microphone access to record your recitation.");
    }
  };

  const rs = result ? rubricScore(result.rubric) : null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Voice assignments</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Recite to {tName}</h1>
      <p className="mt-2 text-muted-foreground">Pick a surah, recite it aloud, and {tName} gently reviews your Qalqalah and Ghunnah and checks every word.</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {quran.map((x) => (
          <button key={x.id} type="button" onClick={() => { setSelected(x.id); setResult(null); }}
            className={cn("rounded-2xl border bg-card p-4 text-left transition-colors", selected === x.id ? "border-gold bg-gold/10" : "border-border hover:bg-secondary")}>
            <span className="font-display font-semibold">{x.title}</span>
            <span className="block text-sm text-muted-foreground">{x.focus}</span>
            {history[x.id]?.[0] && <span className="mt-1 block text-xs text-primary">Last: {history[x.id]![0]!.score}% words</span>}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-semibold">{a.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{a.instructions}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm">Feedback in:</span>
          {LANG_OPTS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setLang(id)} className={cn("rounded-full border px-3 py-1 text-sm", lang === id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{label}</button>
          ))}
        </div>
        <div className="mt-5">
          {busy ? (
            <Button disabled size="lg"><Loader2 className="animate-spin" /> {tName} is listening…</Button>
          ) : recording ? (
            <Button size="lg" variant="destructive" onClick={() => rec.current?.stop()}><Square /> Stop & check</Button>
          ) : (
            <Button size="lg" onClick={start}><Mic /> Start reciting</Button>
          )}
        </div>
      </section>

      {result && (
        <section className="mt-6 space-y-4 rounded-3xl border border-gold/50 bg-card p-5">
          <div className="flex flex-wrap gap-6">
            <div><p className="text-3xl font-semibold">{result.score}%</p><p className="text-xs text-muted-foreground">words matched</p></div>
            {rs !== null && <div><p className="text-3xl font-semibold">{rs}%</p><p className="text-xs text-muted-foreground">rubric points good</p></div>}
          </div>
          {result.summary && <p className="leading-relaxed">{result.summary}</p>}
          {RUBRICS.map((g) => (
            <div key={g.id}>
              <h3 className="font-display font-semibold">{g.title}</h3>
              <ul className="mt-2 space-y-2">
                {g.criteria.map((c) => {
                  const r = result.rubric.find((x) => x.id === c.id);
                  return (
                    <li key={c.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
                      <span className="font-medium">{c.label}</span>
                      <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", r?.rating === "good" ? "bg-primary text-primary-foreground" : r?.rating === "practice" ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground")}>
                        {RATING_LABEL[r?.rating ?? "not_heard"]}
                      </span>
                      {r?.note && <p className="mt-1 text-muted-foreground">{r.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {result.missing.length > 0 && <p className="text-sm">Words {tName} didn't hear: <span className="quran-text text-lg">{result.missing.join(" ")}</span></p>}
          {result.tips.length > 0 && <ul className="list-disc pl-5 text-sm">{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
          <p className="text-xs text-muted-foreground">This review is an AI estimate to help you practise, not a teacher's ruling. {TAJWEED_REMINDER}</p>
        </section>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Rubric based on {TAJWEED_SOURCE}. Ayah text from Tanzil via AlQuran.cloud.</p>
    </div>
  );
}
