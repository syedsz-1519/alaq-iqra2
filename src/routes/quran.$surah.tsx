import { shareImage } from "@/lib/share";
import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, BookOpenText, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Copy, History, Languages, Pause, Play, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  LANGS,
  LANG_IDS,
  extraTranslationQuery,
  normalizeSettings,
  type LangId,
  surahListQuery,
  surahQuery,
  surahTextUrl,
  toArabicDigits,
  type ReadingView,
  type Settings,
  type VerseRow,
} from "@/lib/quran";
import { KEYS, readStored, useStored, writeStored } from "@/lib/storage";
import { recordProgress, resumeAyah, toggleBookmark, useBookmarks, type LastRead, type ProgressMap } from "@/lib/reading";
import { useAudioPlayer } from "@/components/alaq/audio-player";
import { ErrorNotice } from "@/components/alaq/app-shell";
import { OfflineIndicator, TextSavedBadge } from "@/components/alaq/offline-badges";
import { QuranSections } from "@/components/alaq/quran-sections";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pageBudget, paginate } from "@/lib/mushaf";

export const Route = createFileRoute("/quran/$surah")({
  validateSearch: (s: Record<string, unknown>): { ayah?: number } => {
    const n = Number(s["ayah"]);
    return Number.isInteger(n) && n > 0 ? { ayah: n } : {};
  },
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
    const title = loaderData
      ? `Read Surah ${loaderData.englishName} (${loaderData.number}) with translation | Alaq`
      : "Surah — Alaq";
    const description = loaderData
      ? `Read Surah ${loaderData.englishName} (${loaderData.translation}) in Uthmani Arabic with English, Urdu, Roman Urdu, Telugu and Marathi translation.`
      : "Read and listen to the Holy Quran.";
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
  errorComponent: SurahError,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="That surah doesn't exist. The Quran has 114 surahs." />
    </div>
  ),
  component: SurahReader,
});

function SurahError() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="This surah couldn't be loaded." onRetry={() => router.invalidate()} />
    </div>
  );
}

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/** The chosen Arabic size, scaled down on narrow phones so a line never overflows the page. */
const arabicFont = (size: number, vwPerPx: number) => `min(${size}px, ${(size * vwPerPx).toFixed(2)}vw)`;

type PageRow = VerseRow & { translation?: string | undefined };

function SurahReader() {
  const n = Number(Route.useParams().surah);
  const { ayah: targetAyah } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(surahQuery(n));
  const { data: surahs } = useSuspenseQuery(surahListQuery());
  const [rawSettings, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const settings = normalizeSettings(rawSettings);
  const player = useAudioPlayer();
  const view = settings.view;
  const setView = (v: ReadingView) => setSettings((p) => ({ ...normalizeSettings(p), view: v }));
  // One reading language, chosen from the dropdown; it is also the language spoken after each ayah.
  const lang: LangId = settings.translations[0] ?? "en";
  const setLang = (l: LangId) => {
    setSettings((p) => ({ ...normalizeSettings(p), translations: [l] }));
    if (player.voiceTranslation !== "none") player.setVoiceTranslation(l);
  };
  const { data: extraData } = useQuery(extraTranslationQuery(lang, n));
  // The Bismillah's meaning comes from the same translation's Al-Fatihah 1:1, never typed by hand.
  const { data: fatiha } = useQuery({ ...surahQuery(1), enabled: data.bismillah && view === "translated" });
  const { data: fatihaExtra } = useQuery({
    ...extraTranslationQuery(lang, 1),
    enabled: data.bismillah && view === "translated" && Boolean(LANGS[lang].edition),
  });
  const bismillahMeaning = lang === "en" ? fatiha?.verses[0]?.en : lang === "ur" ? fatiha?.verses[0]?.ur : fatihaExtra?.[0];
  const [bookmarks, setBookmarks] = useBookmarks();
  const { meta, verses } = data;

  const playingHere = player.surah === n;
  const currentAyah = playingHere ? (player.ayahs[player.index]?.numberInSurah ?? null) : null;

  const rows: PageRow[] = useMemo(
    () =>
      verses.map((v) => ({
        ...v,
        translation: lang === "en" ? v.en : lang === "ur" ? v.ur : extraData?.[v.numberInSurah - 1],
      })),
    [verses, lang, extraData],
  );
  // Arabic-only reading is laid out as illuminated mushaf pages; with translation it is one flowing list.
  const pages = useMemo(
    () => (view === "arabic" ? paginate(rows, pageBudget(view, settings.arabicSize), view) : [rows]),
    [rows, view, settings.arabicSize],
  );
  const paged = view === "arabic";

  // Jump to the requested ayah.
  useEffect(() => {
    if (!targetAyah) {
      window.scrollTo({ top: 0 });
      return;
    }
    const t = setTimeout(() => {
      document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [n, targetAyah]);

  // When listening to this surah, follow the recitation while reading.
  useEffect(() => {
    if (currentAyah && player.playing) {
      document.getElementById(`ayah-${currentAyah}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentAyah, player.playing]);

  // Remember where the reader is, per surah and as the global "continue reading" spot.
  const saveSpot = useCallback(
    (ayah: number) => {
      const map = readStored<ProgressMap>(KEYS.progress, {});
      const next = recordProgress(map, n, ayah, meta.numberOfAyahs);
      if (next === map) return;
      writeStored(KEYS.progress, next);
      writeStored<LastRead>(KEYS.lastRead, {
        surah: n,
        ayah: next[n]?.ayah ?? ayah,
        englishName: meta.englishName,
        name: meta.name,
        total: meta.numberOfAyahs,
        at: Date.now(),
      });
    },
    [n, meta.englishName, meta.name, meta.numberOfAyahs],
  );

  // Offer "continue from ayah X" when a surah is reopened without a specific ayah.
  const [offerResume, setOfferResume] = useState<number | null>(null);
  useEffect(() => {
    setOfferResume(targetAyah ? null : resumeAyah(readStored<ProgressMap>(KEYS.progress, {}), n));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // Only real reading moves the saved spot — merely opening a surah (or peeking at a bookmark) never overwrites it.
  useEffect(() => {
    let moved = false;
    const openedAt = Date.now();
    const markMoved = () => {
      moved = true;
    };
    const onScroll = () => {
      if (Date.now() - openedAt > 800) moved = true;
      if (!moved) return;
      const last = document.getElementById(`ayah-${meta.numberOfAyahs}`);
      if (last && last.getBoundingClientRect().bottom <= window.innerHeight) saveSpot(meta.numberOfAyahs);
    };
    const obs = new IntersectionObserver(
      (entries) => {
        if (!moved) return;
        const visible = entries.find((e) => e.isIntersecting);
        const a = visible ? Number((visible.target as HTMLElement).dataset["ayah"]) : 0;
        if (a) saveSpot(a);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    document.querySelectorAll("[data-ayah]").forEach((el) => obs.observe(el));
    const opts = { passive: true } as const;
    window.addEventListener("wheel", markMoved, opts);
    window.addEventListener("touchmove", markMoved, opts);
    window.addEventListener("keydown", markMoved);
    window.addEventListener("scroll", onScroll, opts);
    return () => {
      obs.disconnect();
      window.removeEventListener("wheel", markMoved);
      window.removeEventListener("touchmove", markMoved);
      window.removeEventListener("keydown", markMoved);
      window.removeEventListener("scroll", onScroll);
    };
  }, [n, view, pages.length, meta.numberOfAyahs, saveSpot]);

  // Listening along also counts as reading.
  useEffect(() => {
    if (currentAyah && player.playing) saveSpot(currentAyah);
  }, [currentAyah, player.playing, saveSpot]);

  const goToAyah = (ayah: number) => navigate({ search: { ayah }, replace: true });
  const hereMarks = useMemo(
    () => bookmarks.filter((b) => b.surah === n).sort((a, b) => a.ayah - b.ayah),
    [bookmarks, n],
  );

  const onBookmark = (v: VerseRow) => {
    const had = bookmarks.some((b) => b.surah === n && b.ayah === v.numberInSurah);
    setBookmarks((list) =>
      toggleBookmark(list, {
        surah: n,
        ayah: v.numberInSurah,
        englishName: meta.englishName,
        preview: v.en.slice(0, 120),
        arabic: v.arabic.split(" ").slice(0, 8).join(" "),
      }),
    );
    toast(had ? "Bookmark removed" : `Bookmarked ${meta.englishName} ${n}:${v.numberInSurah}`);
  };

  const onCopy = async (v: PageRow) => {
    const text = `${v.arabic}\n\n${v.translation ?? v.en}\n\n— Quran ${n}:${v.numberInSurah} (${meta.englishName})`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Ayah copied");
    } catch {
      toast.error("Couldn't copy on this device");
    }
  };

  /** Plays one ayah: Arabic only, or Arabic followed by the chosen language. */
  const listen = (ayah: number, withTranslation: boolean) => {
    const voice = withTranslation ? lang : "none";
    if (playingHere && currentAyah === ayah && player.voiceTranslation === voice) {
      player.toggle();
      return;
    }
    player.setVoiceTranslation(voice);
    void player.playSurah(n, ayah);
  };
  const isPlaying = (ayah: number, withTranslation: boolean) =>
    player.playing && currentAyah === ayah && (player.voiceTranslation !== "none") === withTranslation;

  /** One ayah in the Arabic-only page, with its number mark opening listen / bookmark / copy. */
  const arabicAyah = (v: PageRow) => {
    const active = currentAyah === v.numberInSurah;
    const marked = bookmarks.some((b) => b.surah === n && b.ayah === v.numberInSurah);
    return (
                        <span
                          key={v.numberInSurah}
                          id={`ayah-${v.numberInSurah}`}
                          data-ayah={v.numberInSurah}
                          className={cn(
                            "scroll-mt-48 rounded-lg transition-colors",
                            active && "bg-gold/25",
                            targetAyah === v.numberInSurah && !active && "bg-gold/15",
                          )}
                        >
                          {v.arabic}{" "}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Ayah ${v.numberInSurah}: listen, bookmark or copy${marked ? " (bookmarked)" : ""}`}
                                className={cn(
                                  "ayah-mark relative whitespace-nowrap text-[0.7em] hover:opacity-70",
                                  marked ? "text-lapis" : "text-gold",
                                )}
                              >
                                ﴿{toArabicDigits(v.numberInSurah)}﴾
                                {marked && (
                                  <BookmarkCheck aria-hidden className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 text-gold" />
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="center" className="w-56 p-1.5" dir="ltr">
                              <p className="px-2 pb-1 pt-0.5 text-xs font-semibold text-muted-foreground">
                                {meta.englishName} {n}:{v.numberInSurah}
                              </p>
                              <MenuBtn onClick={() => listen(v.numberInSurah, false)}>
                                {isPlaying(v.numberInSurah, false) ? <Pause className="size-4" /> : <Play className="size-4" />}
                                {isPlaying(v.numberInSurah, false) ? "Pause" : "Listen from here"}
                              </MenuBtn>
                              <MenuBtn onClick={() => onBookmark(v)}>
                                {marked ? <BookmarkCheck className="size-4 text-gold" /> : <Bookmark className="size-4" />}
                                {marked ? "Remove bookmark" : "Bookmark this ayah"}
                              </MenuBtn>
                              <MenuBtn onClick={() => onCopy(v)}>
                                <Copy className="size-4" /> Copy ayah
                              </MenuBtn>
                            </PopoverContent>
                          </Popover>{" "}
                        </span>
                      );
  };
  // In Al-Fatihah the Bismillah is ayah 1: it stands on its own line under the surah name, as in a printed mushaf.
  const fatihaOpening = n === 1 ? rows[0] : undefined;

  const prevSurah = n > 1 ? surahs[n - 2] : null;
  const nextSurah = n < 114 ? surahs[n] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <OfflineIndicator className="mb-4" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link to="/quran" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> All surahs
        </Link>
        <QuranSections active="read" surah={n} />
      </div>

      <div className="sticky top-16 z-20 -mx-4 mt-3 border-b border-border/60 bg-background/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Reading view" className="inline-flex h-9 shrink-0 items-center rounded-full border border-border bg-card p-0.5 text-xs font-medium">
            {(["arabic", "translated"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors",
                  view === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "arabic" ? <BookOpen className="size-3.5" /> : <BookOpenText className="size-3.5" />}
                <span className="sm:hidden">{v === "arabic" ? "Arabic" : "Translated"}</span>
                <span className="hidden sm:inline">{v === "arabic" ? "Arabic only" : "With translation"}</span>
              </button>
            ))}
          </div>
          <Select value={lang} onValueChange={(v) => setLang(v as LangId)}>
            <SelectTrigger aria-label="Translation language" className="h-9 min-w-0 flex-1 gap-1.5 rounded-full bg-card px-3 text-xs sm:w-auto sm:min-w-40 sm:flex-none">
              <Languages className="size-3.5 shrink-0 text-gold" />
              <span className="truncate"><SelectValue /></span>
            </SelectTrigger>
            <SelectContent>
              {LANG_IDS.map((l) => (
                <SelectItem key={l} value={l}>
                  <span className="font-medium">{LANGS[l].label}</span>
                  {LANGS[l].native !== LANGS[l].label && <span className="ml-1.5 text-muted-foreground">{LANGS[l].native}</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-full bg-card" aria-label="Reading options: text size, go to surah or ayah">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Go to</p>
                <div className="flex gap-2">
                  <Select value={String(n)} onValueChange={(v) => navigate({ to: "/quran/$surah", params: { surah: v }, search: {} })}>
                    <SelectTrigger aria-label="Go to surah" className="h-9 min-w-0 flex-1 bg-card text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {surahs.map((s) => (
                        <SelectItem key={s.number} value={String(s.number)}>
                          {s.number}. {s.englishName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={targetAyah ? String(targetAyah) : ""} onValueChange={(v) => navigate({ search: { ayah: Number(v) }, replace: true })}>
                    <SelectTrigger aria-label="Go to ayah" className="h-9 w-24 bg-card text-xs">
                      <SelectValue placeholder="Ayah" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {verses.map((v) => (
                        <SelectItem key={v.numberInSurah} value={String(v.numberInSurah)}>
                          Ayah {v.numberInSurah}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your bookmarks here{hereMarks.length ? ` (${hereMarks.length})` : ""}
                </p>
                {hereMarks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None yet — tap an ayah's bookmark to save it.</p>
                ) : (
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {hereMarks.map((b) => (
                      <button
                        key={b.ayah}
                        type="button"
                        onClick={() => goToAyah(b.ayah)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-gold/50 px-2.5 text-xs font-medium hover:bg-gold/15"
                      >
                        <BookmarkCheck className="size-3 text-gold" /> {n}:{b.ayah}
                      </button>
                    ))}
                  </div>
                )}
                <Link to="/quran" search={{ tab: "bookmarks" }} className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline">
                  All bookmarks
                </Link>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arabic text size</p>
                <Slider
                  min={22}
                  max={52}
                  step={2}
                  value={[settings.arabicSize]}
                  onValueChange={([v]) => setSettings((p) => ({ ...DEFAULT_SETTINGS, ...p, arabicSize: v ?? DEFAULT_SETTINGS.arabicSize }))}
                />
                <p className="quran-text mt-3 text-center" style={{ fontSize: settings.arabicSize }}>
                  ٱلْحَمْدُ لِلَّهِ
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                <TextSavedBadge url={surahTextUrl(n)} />
                <span className="truncate text-[11px] text-muted-foreground">{LANGS[lang].translator}</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {offerResume && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gold/40 bg-card p-2 pl-3 shadow-sm">
          <History className="size-4 shrink-0 text-gold" />
          <p className="min-w-0 flex-1 text-sm">
            You stopped at <span className="font-semibold">ayah {offerResume}</span>
          </p>
          <Button
            size="sm"
            className="h-8 rounded-full"
            onClick={() => {
              goToAyah(offerResume);
              setOfferResume(null);
            }}
          >
            Continue
          </Button>
          <button
            type="button"
            aria-label="Start from the beginning instead"
            onClick={() => setOfferResume(null)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-8">
        {pages.map((page, pi) => (
          <article
            key={`${view}-${pi}`}
            aria-label={paged ? `Page ${pi + 1} of ${pages.length}` : `Surah ${meta.englishName} with translation`}
            className={paged ? "mushaf-page min-h-[28rem]" : "reading-card rounded-[1.75rem]"}
          >
            <div className={cn("flex flex-col", paged ? "px-1.5 py-3 sm:px-3 sm:py-4 md:px-8 md:py-6" : "px-4 py-5 sm:px-5 sm:py-6 md:px-10 md:py-9")}>
              {paged && (
                <div className="flex items-center justify-between border-b border-gold/40 pb-1.5 text-[11px] text-paper-muted">
                  <span className="font-display">{meta.englishName}</span>
                  <span className="quran-text text-base text-paper-ink">{meta.name}</span>
                </div>
              )}

              {pi === 0 && (
                <header className={paged ? "mt-4 md:mt-5" : ""}>
                  <div className="surah-banner rounded-xl px-3 py-3 text-center sm:px-4">
                    <p className="quran-text text-[1.75rem] leading-[1.6] sm:text-3xl md:text-4xl">{meta.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-90 sm:tracking-[0.25em]">
                      Surah {n} · {meta.englishName} · {meta.revelationType} · {meta.numberOfAyahs} ayahs
                    </p>
                  </div>
                  <h1 className="sr-only">
                    Surah {meta.englishName} ({meta.englishNameTranslation})
                  </h1>
                  {data.bismillah ? (
                    <div className="mt-4 text-center" aria-label="Bismillah — the opening of the surah">
                      <p lang="ar" dir="rtl" className="quran-text text-[1.6rem] leading-[1.9] text-paper-ink sm:text-3xl md:text-[2.1rem]">
                        {BISMILLAH}
                      </p>
                      {!paged && bismillahMeaning && (
                        <p
                          dir={LANGS[lang].dir}
                          className={cn(
                            "mx-auto mt-1 max-w-md text-paper-muted",
                            lang === "ur" ? "urdu-text text-base" : "text-sm italic",
                          )}
                        >
                          {bismillahMeaning}
                        </p>
                      )}
                      <div aria-hidden className="bismillah-rule mx-auto mt-3 h-px w-40" />
                    </div>
                  ) : fatihaOpening && paged ? (
                    <div className="mt-4 text-center" aria-label="Bismillah — the first ayah of Al-Fatihah">
                      <p dir="rtl" className="quran-text leading-[2.2]" style={{ fontSize: arabicFont(settings.arabicSize, 0.235) }}>
                        {arabicAyah(fatihaOpening)}
                      </p>
                      <div aria-hidden className="bismillah-rule mx-auto mt-2 h-px w-40" />
                    </div>
                  ) : n === 9 ? (
                    <p className="mt-4 text-center text-xs text-paper-muted">Surah At-Tawbah begins without the Bismillah.</p>
                  ) : null}
                </header>
              )}

              <div className="mt-5 flex-1">
                {view === "arabic" ? (
                  <p dir="rtl" className="quran-text text-justify leading-[2.6] [text-align-last:center]" style={{ fontSize: arabicFont(settings.arabicSize, 0.235) }}>
                    {page.filter((v) => !(fatihaOpening && v.numberInSurah === 1)).map(arabicAyah)}
                  </p>
                ) : (
                  <ol className="divide-y divide-gold/30">
                    {page.map((v) => {
                      const active = currentAyah === v.numberInSurah;
                      const marked = bookmarks.some((b) => b.surah === n && b.ayah === v.numberInSurah);
                      return (
                        <li
                          key={v.numberInSurah}
                          id={`ayah-${v.numberInSurah}`}
                          data-ayah={v.numberInSurah}
                          className={cn(
                            "scroll-mt-48 py-5 transition-colors first:pt-0 last:pb-0",
                            active && "-mx-3 rounded-xl bg-gold/15 px-3",
                            targetAyah === v.numberInSurah && !active && "-mx-3 rounded-xl bg-gold/10 px-3",
                          )}
                        >
                          <p dir="rtl" className="quran-text text-right leading-[2.2]" style={{ fontSize: arabicFont(settings.arabicSize, 0.26) }}>
                            {v.arabic} <span className="ayah-mark whitespace-nowrap text-[0.7em] text-gold">﴿{toArabicDigits(v.numberInSurah)}﴾</span>
                          </p>
                          {v.translation ? (
                            <p
                              dir={LANGS[lang].dir}
                              className={cn(
                                "mt-3 leading-relaxed text-paper-ink/85",
                                lang === "ur" ? "urdu-text text-right text-lg" : "text-[1.02rem]",
                              )}
                            >
                              {v.translation}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-paper-muted">Loading {LANGS[lang].label} translation…</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-1 text-paper-muted">
                            <span className="mr-auto text-xs font-medium tabular-nums">
                              {n}:{v.numberInSurah}
                              {v.sajda && <span className="ml-1 text-gold">· Sajdah</span>}
                            </span>
                            <ListenBtn active={isPlaying(v.numberInSurah, false)} onClick={() => listen(v.numberInSurah, false)}>
                              Arabic
                            </ListenBtn>
                            <ListenBtn active={isPlaying(v.numberInSurah, true)} onClick={() => listen(v.numberInSurah, true)}>
                              + {LANGS[lang].label}
                            </ListenBtn>
                            <ActionBtn label={marked ? "Remove bookmark" : "Bookmark ayah"} onClick={() => onBookmark(v)}>
                              {marked ? <BookmarkCheck className="size-4 text-gold" /> : <Bookmark className="size-4" />}
                            </ActionBtn>
                            <ActionBtn label="Copy ayah" onClick={() => onCopy(v)}>
                              <Copy className="size-4" />
                            </ActionBtn>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {!paged && (
                <p className="mt-6 border-t border-gold/30 pt-3 text-center text-[11px] text-paper-muted">
                  {LANGS[lang].label} translation: {LANGS[lang].translator}
                </p>
              )}

              {paged && <div className="mt-6 flex justify-center">
                <span className="page-medallion grid size-9 place-items-center rounded-full font-display text-sm font-semibold" title={`Page ${pi + 1} of ${pages.length}`}>
                  {toArabicDigits(pi + 1)}
                </span>
              </div>}
            </div>
          </article>
        ))}
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-3">
        {prevSurah ? (
          <Link
            to="/quran/$surah"
            params={{ surah: String(prevSurah.number) }}
            search={{}}
            className="rounded-2xl border border-border bg-card p-4 hover:bg-secondary"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="font-display font-semibold">{prevSurah.englishName}</span>
          </Link>
        ) : (
          <span />
        )}
        {nextSurah && (
          <Link
            to="/quran/$surah"
            params={{ surah: String(nextSurah.number) }}
            search={{}}
            className="rounded-2xl border border-border bg-card p-4 text-right hover:bg-secondary"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="font-display font-semibold">{nextSurah.englishName}</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

function MenuBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
    >
      {children}
    </button>
  );
}

function ListenBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
        active ? "border-lapis bg-lapis text-lapis-foreground" : "border-gold/50 text-paper-ink hover:bg-gold/15",
      )}
    >
      {active ? <Pause className="size-3" /> : <Play className="size-3" />}
      {children}
    </button>
  );
}

function ActionBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-paper-muted transition-colors hover:bg-gold/15 hover:text-paper-ink"
    >
      {children}
    </button>
  );
}
