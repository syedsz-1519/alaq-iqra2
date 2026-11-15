import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Loader2, Pause, Play, Repeat1, SkipBack, SkipForward } from "lucide-react";
import { shareImage } from "@/lib/share";
import {
  DEFAULT_SETTINGS,
  LANGS,
  LANG_IDS,
  VOICE_LANGS,
  normalizeSettings,
  reciterForSurah,
  reciterName,
  surahListQuery,
  surahQuery,
  toArabicDigits,
  type Settings,
  type VoiceLang,
} from "@/lib/quran";
import { KEYS, useStored } from "@/lib/storage";
import { useAudioPlayer } from "@/components/alaq/audio-player";
import { ErrorNotice } from "@/components/alaq/app-shell";
import { OfflineIndicator, RecitationDownload } from "@/components/alaq/offline-badges";
import { QuranSections } from "@/components/alaq/quran-sections";
import { ReciterSelect } from "@/components/alaq/reciter-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listen/$surah")({
  loader: async ({ params, context }) => {
    const n = Number(params.surah);
    if (!Number.isInteger(n) || n < 1 || n > 114) throw notFound();
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(surahQuery(n)),
      context.queryClient.ensureQueryData(surahListQuery()),
    ]);
    return { englishName: data.meta.englishName, translation: data.meta.englishNameTranslation, number: n };
  },
  head: ({ loaderData, match }) => {
    const title = loaderData ? `Listen to Surah ${loaderData.englishName} (${loaderData.number}) | Alaq` : "Listen — Alaq";
    const description = loaderData
      ? `Listen to Surah ${loaderData.englishName} (${loaderData.translation}) ayah by ayah — choose your reciter and hear the meaning in your language.`
      : "Listen to the Holy Quran.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        ...shareImage(match.context.origin),
      ],
    };
  },
  errorComponent: ListenError,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="That surah doesn't exist. The Quran has 114 surahs." />
    </div>
  ),
  component: SurahListener,
});

function ListenError() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="This surah couldn't be loaded." onRetry={() => router.invalidate()} />
    </div>
  );
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

function SurahListener() {
  const n = Number(Route.useParams().surah);
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(surahQuery(n));
  const { data: surahs } = useSuspenseQuery(surahListQuery());
  const [raw, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(raw);
  const player = useAudioPlayer();
  const { meta, verses } = data;

  const here = player.surah === n;
  const current = here ? (player.ayahs[player.index]?.numberInSurah ?? null) : null;
  const reciter = here ? player.reciter : reciterForSurah(settings, n);
  const pct = here && player.duration ? (player.progress / player.duration) * 100 : 0;

  const chooseReciter = (id: string, forAll = false) => {
    if (here) return player.setReciter(id, forAll);
    setSettings((p) => {
      const cur = normalizeSettings(p);
      return forAll ? { ...cur, reciter: id, surahReciters: {} } : { ...cur, surahReciters: { ...cur.surahReciters, [String(n)]: id } };
    });
  };
  const play = (a: number) => (here && current === a ? player.toggle() : void player.playSurah(n, a));

  useEffect(() => {
    if (current && player.playing) document.getElementById(`l-ayah-${current}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current, player.playing]);

  const prevSurah = n > 1 ? surahs[n - 2] : null;
  const nextSurah = n < 114 ? surahs[n] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <OfflineIndicator className="mb-4" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link to="/listen" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> All surahs
        </Link>
        <QuranSections active="listen" surah={n} />
      </div>

      <section className="bg-hero relative mt-5 overflow-hidden rounded-[2rem] px-6 pb-7 pt-8 text-center text-night-foreground shadow-elegant">
        <div className="girih pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            Surah {n} · {meta.numberOfAyahs} ayahs
          </p>
          <p className="quran-text mt-1 text-5xl leading-[1.7] text-gold">{meta.name}</p>
          <h1 className="font-display text-2xl font-semibold">{meta.englishName}</h1>
          <p className="mt-1 text-sm opacity-80">{reciterName(reciter)}</p>

          <div className="mx-auto mt-6 max-w-md">
            <div className="h-1.5 overflow-hidden rounded-full bg-night-foreground/15">
              <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs tabular-nums opacity-70">
              <span>{here ? `Ayah ${current ?? 1} of ${meta.numberOfAyahs}` : "Ready"}</span>
              <span>{here && player.duration ? `${fmt(player.progress)} / ${fmt(player.duration)}` : ""}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <RoundBtn label="Previous ayah" onClick={() => (here ? player.prev() : void player.playSurah(n, 1))}>
              <SkipBack className="size-5" />
            </RoundBtn>
            <button
              type="button"
              onClick={() => (here ? player.toggle() : void player.playSurah(n, 1))}
              aria-label={here && player.playing ? "Pause" : "Play surah"}
              className="bg-gold-gradient grid size-16 place-items-center rounded-full text-gold-foreground shadow-glow transition-transform active:scale-95"
            >
              {here && player.loading ? <Loader2 className="size-6 animate-spin" /> : here && player.playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
            </button>
            <RoundBtn label="Next ayah" onClick={() => (here ? player.next() : void player.playSurah(n, 2))}>
              <SkipForward className="size-5" />
            </RoundBtn>
          </div>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              aria-pressed={player.repeatAyah}
              onClick={() => player.setRepeatAyah(!player.repeatAyah)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors",
                player.repeatAyah ? "bg-gold/25 text-gold" : "opacity-75 hover:opacity-100",
              )}
            >
              <Repeat1 className="size-3.5" /> Repeat each ayah {player.repeatAyah ? "on" : "off"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-elegant sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Reciter for this surah</p>
          <ReciterSelect value={reciter} onChange={(id) => chooseReciter(id)} className="w-full" />
          <button
            type="button"
            onClick={() => chooseReciter(reciter, true)}
            disabled={reciter === settings.reciter && !settings.surahReciters[String(n)]}
            className="mt-1.5 text-xs text-primary underline-offset-2 hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            Use {reciterName(reciter)} for every surah
          </button>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hear the meaning after each ayah</p>
          <Select value={player.voiceTranslation} onValueChange={(v) => player.setVoiceTranslation(v as VoiceLang)}>
            <SelectTrigger aria-label="Spoken translation" className="h-9 w-full bg-card text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["none", ...LANG_IDS] as VoiceLang[]).map((l) => (
                <SelectItem key={l} value={l}>
                  {l === "none" ? "Arabic recitation only" : `Arabic, then ${LANGS[l].label}${VOICE_LANGS[l].ai ? " (needs sign-in)" : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {player.voiceTranslation === "none" ? "Recitation only." : VOICE_LANGS[player.voiceTranslation].narrator}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <RecitationDownload reciter={reciter} surah={n} count={meta.numberOfAyahs} />
          <Link
            to="/quran/$surah"
            params={{ surah: String(n) }}
            search={current ? { ayah: current } : {}}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium hover:bg-secondary"
          >
            <BookOpen className="size-3.5" /> Read along
          </Link>
        </div>
      </section>

      <ol className="mt-5 space-y-2">
        {verses.map((v) => {
          const active = current === v.numberInSurah;
          const playing = active && player.playing;
          return (
            <li key={v.numberInSurah} id={`l-ayah-${v.numberInSurah}`} className="scroll-mt-40">
              <button
                type="button"
                onClick={() => play(v.numberInSurah)}
                aria-label={playing ? `Pause ayah ${v.numberInSurah}` : `Play ayah ${v.numberInSurah}`}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors",
                  active ? "border-gold bg-gold/10" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                    active ? "bg-gold-gradient text-gold-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {active && player.loading ? <Loader2 className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : v.numberInSurah}
                </span>
                <span className="quran-text line-clamp-2 flex-1 text-right text-xl leading-[2]">
                  {v.arabic} <span className="ayah-mark text-[0.75em] text-gold">﴿{toArabicDigits(v.numberInSurah)}﴾</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <nav className="mt-8 grid grid-cols-2 gap-3">
        {prevSurah ? (
          <button type="button" onClick={() => void navigate({ to: "/listen/$surah", params: { surah: String(prevSurah.number) } })} className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-secondary">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="font-display font-semibold">{prevSurah.englishName}</span>
          </button>
        ) : (
          <span />
        )}
        {nextSurah && (
          <button type="button" onClick={() => void navigate({ to: "/listen/$surah", params: { surah: String(nextSurah.number) } })} className="rounded-2xl border border-border bg-card p-4 text-right hover:bg-secondary">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="font-display font-semibold">{nextSurah.englishName}</span>
          </button>
        )}
      </nav>
    </div>
  );
}

function RoundBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-night-foreground/25 transition-colors hover:bg-night-foreground/10"
    >
      {children}
    </button>
  );
}
