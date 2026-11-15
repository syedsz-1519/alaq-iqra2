import { shareImage } from "@/lib/share";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck, CheckCircle2, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { surahListQuery, surahTextUrl } from "@/lib/quran";
import { CACHE_TEXT } from "@/lib/offline-cache";
import { isFinished, sortBookmarks, useBookmarks, useProgress, type BookmarkOrder } from "@/lib/reading";
import { useStored } from "@/lib/storage";
import { ErrorNotice, PageHeader } from "@/components/alaq/app-shell";
import { ContinueReadingCard } from "@/components/alaq/continue-reading";
import { OfflineIndicator } from "@/components/alaq/offline-badges";
import { QuranSections } from "@/components/alaq/quran-sections";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type QuranTab = "surahs" | "bookmarks";

export const Route = createFileRoute("/quran/")({
  validateSearch: (s: Record<string, unknown>): { tab?: QuranTab } =>
    s["tab"] === "bookmarks" ? { tab: "bookmarks" } : {},
  loader: ({ context }) => context.queryClient.ensureQueryData(surahListQuery()),
  head: ({ match }) => ({
    meta: [
      { title: "Read the Holy Quran — All 114 Surahs | Alaq" },
      { name: "description", content: "Browse all 114 surahs of the Holy Quran. Read in Uthmani Arabic with English, Urdu, Roman Urdu, Telugu and Marathi translation." },
      { property: "og:title", content: "Read the Holy Quran — All 114 Surahs | Alaq" },
      { property: "og:description", content: "Read every surah with translation, bookmarks and offline saving." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="The surah list couldn't be loaded." onRetry={() => location.reload()} />
    </div>
  ),
  component: QuranIndex,
});

function useSavedSurahs() {
  const [saved, setSaved] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!("caches" in window)) return;
    void caches.open(CACHE_TEXT).then(async (cache) => {
      const keys = new Set((await cache.keys()).map((r) => r.url));
      const s = new Set<number>();
      for (let i = 1; i <= 114; i++) if (keys.has(surahTextUrl(i))) s.add(i);
      setSaved(s);
    });
  }, []);
  return saved;
}

function QuranIndex() {
  const { data: surahs } = useSuspenseQuery(surahListQuery());
  const [q, setQ] = useState("");
  const [bookmarks, setBookmarks] = useBookmarks();
  const [progress] = useProgress();
  const [order, setOrder] = useStored<BookmarkOrder>("alaq:bookmark-order", "recent");
  const sortedMarks = useMemo(() => sortBookmarks(bookmarks, order), [bookmarks, order]);
  const saved = useSavedSurahs();
  const { tab = "surahs" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return surahs;
    return surahs.filter(
      (s) =>
        String(s.number) === t ||
        s.englishName.toLowerCase().replace(/[-']/g, "").includes(t.replace(/[-'\s]/g, "")) ||
        s.englishNameTranslation.toLowerCase().includes(t) ||
        s.name.includes(q.trim()),
    );
  }, [q, surahs]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <OfflineIndicator className="mb-4 w-fit" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Al-Quran al-Karim" title="Read the Holy Quran">
          114 surahs in Uthmani script with English, Urdu, Roman Urdu, Telugu and Marathi translation.
        </PageHeader>
        <QuranSections active="read" className="mb-6" />
      </div>

      <ContinueReadingCard className="mb-6" />

      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ search: v === "bookmarks" ? { tab: "bookmarks" } : {}, replace: true })}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="surahs">Surahs</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks ({bookmarks.length})</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search surah name or number"
              className="bg-card pl-9"
              aria-label="Search surahs"
            />
          </div>
        </div>

        <TabsContent value="surahs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const p = progress[s.number];
              const done = isFinished(p);
              return (
              <Link
                key={s.number}
                to="/quran/$surah"
                params={{ surah: String(s.number) }}
                search={p && !done && p.ayah > 1 ? { ayah: p.ayah } : {}}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/60"
              >
                <span className="grid size-11 shrink-0 rotate-45 place-items-center rounded-lg border border-gold/50 bg-gold/10">
                  <span className="-rotate-45 text-sm font-semibold">{s.number}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold">{s.englishName}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {s.englishNameTranslation} · {s.numberOfAyahs} ayahs
                    {saved.has(s.number) && (
                      <CheckCircle2 className="size-3.5 text-primary" aria-label="Saved offline" />
                    )}
                  </p>
                  {p && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full", done ? "bg-gold" : "bg-primary")} style={{ width: `${Math.round((p.ayah / p.total) * 100)}%` }} />
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {done ? "Finished" : `Ayah ${p.ayah}`}
                      </span>
                    </div>
                  )}
                </div>
                <span className="quran-text text-xl text-primary">{s.name.replace("سُورَةُ ", "")}</span>
              </Link>
              );
            })}
            {filtered.length === 0 && <p className="text-muted-foreground">No surah matches “{q}”.</p>}
          </div>
          {saved.size > 0 && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-primary" /> {saved.size} of 114 surahs saved for offline reading ·{" "}
              <Link to="/offline" className="underline underline-offset-2">
                Manage offline library
              </Link>
            </p>
          )}
        </TabsContent>

        <TabsContent value="bookmarks">
          {bookmarks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <BookmarkCheck className="mx-auto mb-2 size-6" />
              No bookmarks yet. Tap the bookmark icon on any ayah to save it here.
            </div>
          ) : (
            <>
            <div className="mb-3 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort:</span>
              {(["recent", "quran"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={order === o}
                  onClick={() => setOrder(o)}
                  className={cn(
                    "h-7 rounded-full border px-3 font-medium transition-colors",
                    order === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
                  )}
                >
                  {o === "recent" ? "Newest first" : "Quran order"}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {sortedMarks.map((b) => (
                <div key={`${b.surah}:${b.ayah}`} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <Link
                    to="/quran/$surah"
                    params={{ surah: String(b.surah) }}
                    search={{ ayah: b.ayah }}
                    className="min-w-0 flex-1"
                  >
                    <p className="font-display font-semibold">
                      {b.englishName} <span className="font-sans text-sm text-gold">{b.surah}:{b.ayah}</span>
                    </p>
                    {b.arabic && (
                      <p lang="ar" dir="rtl" className="quran-text mt-1 truncate text-right text-lg leading-loose text-primary">
                        {b.arabic}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.preview}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Saved {new Date(b.at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </Link>
                  <button
                    type="button"
                    aria-label="Remove bookmark"
                    onClick={() => setBookmarks((l) => l.filter((x) => !(x.surah === b.surah && x.ayah === b.ayah)))}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
