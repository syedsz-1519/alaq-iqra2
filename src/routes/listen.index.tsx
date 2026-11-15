import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, Pause, Play, Search } from "lucide-react";
import { shareImage } from "@/lib/share";
import { DEFAULT_SETTINGS, RECITERS, RECITER_GROUPS, normalizeSettings, reciterForSurah, reciterName, surahListQuery, type Settings } from "@/lib/quran";
import { KEYS, useStored } from "@/lib/storage";
import { useAudioPlayer } from "@/components/alaq/audio-player";
import { ErrorNotice } from "@/components/alaq/app-shell";
import { OfflineIndicator } from "@/components/alaq/offline-badges";
import { QuranSections } from "@/components/alaq/quran-sections";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/listen/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahListQuery()),
  head: ({ match }) => ({
    meta: [
      { title: "Listen to the Quran — choose your reciter | Alaq" },
      { name: "description", content: "Listen to all 114 surahs ayah by ayah from the Imams of Makkah and Madinah and the great Egyptian masters, with optional spoken translation." },
      { property: "og:title", content: "Listen to the Quran — Alaq" },
      { property: "og:description", content: "Choose your reciter and listen to every surah, with spoken translation in your language." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="The surah list couldn't be loaded." onRetry={() => location.reload()} />
    </div>
  ),
  component: ListenIndex,
});

function ListenIndex() {
  const { data: surahs } = useSuspenseQuery(surahListQuery());
  const [raw, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(raw);
  const player = useAudioPlayer();
  const [q, setQ] = useState("");

  const chooseDefault = (id: string) => setSettings((p) => ({ ...normalizeSettings(p), reciter: id }));

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return surahs;
    return surahs.filter(
      (s) => String(s.number) === t || s.englishName.toLowerCase().replace(/[-']/g, "").includes(t.replace(/[-'\s]/g, "")) || s.englishNameTranslation.toLowerCase().includes(t),
    );
  }, [q, surahs]);

  const saved = player.saved;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <OfflineIndicator className="mb-4 w-fit" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Al-Quran al-Karim</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Listen to the Quran</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Choose a reciter, then tap any surah. Recitation keeps playing while you move around the app.</p>
        </div>
        <QuranSections active="listen" />
      </div>

      {saved && !player.surah && (
        <button
          type="button"
          onClick={player.resume}
          className="bg-hero mt-6 flex w-full items-center gap-4 rounded-3xl p-5 text-left text-night-foreground shadow-elegant"
        >
          <span className="bg-gold-gradient grid size-12 shrink-0 place-items-center rounded-full text-gold-foreground shadow-glow">
            <Play className="size-5 translate-x-px" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">Continue listening</span>
            <span className="block truncate font-display text-lg">
              {saved.englishName} · Ayah {saved.ayah} of {saved.total}
            </span>
            <span className="block truncate text-xs opacity-75">{reciterName(saved.reciter)}</span>
          </span>
        </button>
      )}

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Choose your reciter</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Now: <span className="font-medium text-foreground">{reciterName(settings.reciter)}</span> · you can also give any surah its own reciter on its listening page.
        </p>
        <div className="space-y-5">
          {RECITER_GROUPS.map((g, gi) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{g}</p>
              <div className="flex flex-wrap gap-2">
                {RECITERS.filter((r) => r.group === gi).map((r) => {
                  const on = settings.reciter === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => chooseDefault(r.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                        on ? "border-gold bg-gold/15 font-semibold text-foreground shadow-glow" : "border-border bg-card text-foreground/80 hover:border-primary/40",
                      )}
                    >
                      {on && <Check className="size-3.5 text-gold" />}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold">Surahs</h2>
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah name or number" className="bg-card pl-9" aria-label="Search surahs" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const here = player.surah === s.number;
            const own = settings.surahReciters[String(s.number)];
            return (
              <div
                key={s.number}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors",
                  here ? "border-gold bg-gold/10" : "border-border hover:border-primary/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => (here ? player.toggle() : void player.playSurah(s.number, 1))}
                  aria-label={here && player.playing ? `Pause ${s.englishName}` : `Play ${s.englishName}`}
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full transition-transform active:scale-95",
                    here ? "bg-gold-gradient text-gold-foreground shadow-glow" : "bg-primary text-primary-foreground",
                  )}
                >
                  {here && player.loading ? <Loader2 className="size-4 animate-spin" /> : here && player.playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
                </button>
                <Link to="/listen/$surah" params={{ surah: String(s.number) }} className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">
                    {s.number}. {s.englishName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.numberOfAyahs} ayahs · {own ? reciterName(reciterForSurah(settings, s.number)) : s.englishNameTranslation}
                  </p>
                </Link>
                <span className="quran-text hidden text-lg text-primary sm:block">{s.name.replace("سُورَةُ ", "")}</span>
                <Link to="/listen/$surah" params={{ surah: String(s.number) }} aria-label={`Open ${s.englishName} player`} className="text-muted-foreground hover:text-foreground">
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-muted-foreground">No surah matches “{q}”.</p>}
        </div>
      </section>
    </div>
  );
}
