import { shareImage } from "@/lib/share";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { collectionInfo, getCollection } from "@/lib/hadith";
import { PageHeader } from "@/components/alaq/app-shell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/hadith/$collection/")({
  loader: ({ params }) => {
    const c = getCollection(params.collection);
    if (!c) throw notFound();
    return { name: c.name };
  },
  head: ({ loaderData, match }) => {
    const title = loaderData ? `${loaderData.name} — Books & Chapters | Alaq` : "Hadith collection | Alaq";
    const description = loaderData
      ? `Browse every book of ${loaderData.name} and read each hadith in Arabic and English.`
      : "Browse hadith books.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...shareImage(match.context.origin),
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { collection } = Route.useParams();
  const c = getCollection(collection)!;
  const info = collectionInfo(c.key);
  const [q, setQ] = useState("");
  const list = useMemo(
    () => c.sections.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()) || String(s.n) === q.trim()),
    [c, q],
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <Link to="/hadith" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> All collections
      </Link>
      <PageHeader eyebrow={info.arabic} title={c.name}>
        {info.compiler}. {info.blurb}
      </PageHeader>
      {c.sections.length > 1 && (
        <div className="relative mb-4 sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books" className="bg-card pl-9" aria-label="Search books" />
        </div>
      )}
      <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {list.map((s) => (
          <li key={s.n}>
            <Link
              to="/hadith/$collection/$section"
              params={{ collection: c.key, section: String(s.n) }}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
            >
              <span className="w-8 shrink-0 text-sm font-semibold text-gold">{s.n}</span>
              <span className="flex-1 font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">
                {s.first === s.last ? `#${s.first}` : `#${s.first}–${s.last}`}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
