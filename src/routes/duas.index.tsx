import { shareImage } from "@/lib/share";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DUA_CATEGORIES, DUA_GROUPS, getDuaCategoryMeta } from "@/lib/duas";
import { PageHeader } from "@/components/alaq/app-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/duas/")({
  head: ({ match }) => ({
    meta: [
      { title: "Duas & Adhkar from Hisnul Muslim | Alaq" },
      { name: "description", content: "Authentic duas from Hisnul Muslim for morning and evening, sleep, prayer, travel, hardship and every moment — Arabic, transliteration and translation." },
      { property: "og:title", content: "Duas & Adhkar from Hisnul Muslim | Alaq" },
      { property: "og:description", content: "132 chapters of authentic supplications with Arabic, transliteration and meaning." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: DuasIndex,
});

function DuasIndex() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t) return DUA_CATEGORIES.filter((c) => c.title.toLowerCase().includes(t));
    if (group === "all") return DUA_CATEGORIES;
    const g = DUA_GROUPS.find((x) => x.key === group);
    return (g?.ids ?? []).map((id) => getDuaCategoryMeta(id)!).filter(Boolean);
  }, [q, group]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <PageHeader eyebrow="Hisn al-Muslim" title="Duas & Adhkar">
        Authentic supplications from the Quran and Sunnah, compiled by Sa'id ibn Ali ibn Wahf al-Qahtani.
      </PageHeader>

      <Link
        to="/duas/$id"
        params={{ id: "27" }}
        className="girih mb-6 flex items-center justify-between gap-4 rounded-3xl bg-ink p-6 text-ink-foreground"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Daily</p>
          <p className="mt-1 font-display text-2xl font-semibold">Morning & evening adhkar</p>
          <p className="mt-1 text-sm opacity-75">Begin and end your day with remembrance.</p>
        </div>
        <p className="quran-text text-3xl text-gold">أذكار الصباح والمساء</p>
      </Link>

      <div className="relative mb-4 sm:w-96">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. travel, rain, anxiety" className="bg-card pl-9" aria-label="Search duas" />
      </div>

      {!q && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ key: "all", title: "All" }, ...DUA_GROUPS].map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                group === g.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
              )}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((c) => (
          <Link
            key={c.id}
            to="/duas/$id"
            params={{ id: String(c.id) }}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-secondary/60"
          >
            <span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-gold">{c.id}</span>
            <span className="flex-1">
              <span className="font-medium">{c.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {c.count} {c.count === 1 ? "dua" : "duas"}
              </span>
            </span>
          </Link>
        ))}
        {results.length === 0 && <p className="text-muted-foreground">No chapter matches “{q}”.</p>}
      </div>
    </div>
  );
}
