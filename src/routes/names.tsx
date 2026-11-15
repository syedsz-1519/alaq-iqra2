import { shareImage } from "@/lib/share";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { dailyNameNumber, namesQuery, type DivineName } from "@/lib/daily";
import { toArabicDigits } from "@/lib/quran";
import { ErrorNotice, PageHeader } from "@/components/alaq/app-shell";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/names")({
  head: ({ match }) => ({
    meta: [
      { title: "99 Names of Allah (Asma ul Husna) — Arabic, Meaning | Alaq" },
      { name: "description", content: "All 99 beautiful names of Allah — Asma ul Husna — in Arabic with transliteration and English meaning." },
      { property: "og:title", content: "99 Names of Allah — Asma ul Husna | Alaq" },
      { property: "og:description", content: "Learn the 99 beautiful names of Allah in Arabic with transliteration and meaning." },
      { property: "og:type", content: "article" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: NamesPage,
});

function NamesPage() {
  const { data, isError, refetch } = useQuery(namesQuery());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<DivineName | null>(null);
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(dailyNameNumber(new Date())), []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!data || !needle) return data ?? [];
    return data.filter(
      (n) => n.transliteration.toLowerCase().includes(needle) || n.meaning.toLowerCase().includes(needle) || n.arabic.includes(q.trim()) || String(n.number) === needle,
    );
  }, [data, q]);

  const featured = data && today ? data[today - 1] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <PageHeader eyebrow="Asma ul Husna" title="The 99 Names of Allah">
        “And to Allah belong the best names, so invoke Him by them.” — Al-A'raf 7:180
      </PageHeader>

      {featured && (
        <button
          type="button"
          onClick={() => setOpen(featured)}
          className="bg-hero relative mb-6 w-full overflow-hidden rounded-[2rem] p-8 text-center text-night-foreground shadow-elegant"
        >
          <div className="girih pointer-events-none absolute inset-0 opacity-60" />
          <p className="relative flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles className="size-3.5" /> Name of the day
          </p>
          <p className="quran-text relative mt-3 text-6xl text-gold md:text-7xl">{featured.arabic}</p>
          <p className="relative mt-2 font-display text-2xl font-semibold">{featured.transliteration}</p>
          <p className="relative opacity-80">{featured.meaning}</p>
        </button>
      )}

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or meaning" className="h-10 rounded-full bg-card pl-9" aria-label="Search the 99 names" />
      </div>

      {isError ? (
        <ErrorNotice message="The 99 Names couldn't be loaded." onRetry={() => void refetch()} />
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((n) => (
            <li key={n.number}>
              <button
                type="button"
                onClick={() => setOpen(n)}
                className={cn(
                  "group relative h-full w-full overflow-hidden rounded-3xl border bg-card p-5 text-center transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-elegant",
                  n.number === today ? "border-gold/60" : "border-border",
                )}
              >
                <span className="ayah-mark absolute left-3 top-2 text-sm text-gold">{toArabicDigits(n.number)}</span>
                <p className="quran-text text-4xl text-primary">{n.arabic}</p>
                <p className="mt-1 font-display text-base font-semibold">{n.transliteration}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.meaning}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Names, transliteration and meanings from the AlAdhan Asma ul Husna dataset (aladhan.com). Scholars list the names from the Quran and the hadith of Tirmidhi (no. 3507).
      </p>

      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="text-center">
          {open && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Name {open.number} of 99</p>
              <p className="quran-text text-7xl text-primary">{open.arabic}</p>
              <DialogTitle className="font-display text-2xl">{open.transliteration}</DialogTitle>
              <DialogDescription className="text-base">{open.meaning}</DialogDescription>
              <p className="mt-2 text-sm text-muted-foreground">
                Call upon Allah by this name in your dua: “Ya {open.transliteration.replace(/^(Al|Ar|As|Ad|At|An|Az|Ash|Adh|Ath)[ -]/i, "")}”.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
