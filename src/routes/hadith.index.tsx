import { shareImage } from "@/lib/share";
import { createFileRoute, Link } from "@tanstack/react-router";
import { COLLECTIONS, collectionInfo } from "@/lib/hadith";
import { PageHeader } from "@/components/alaq/app-shell";

export const Route = createFileRoute("/hadith/")({
  head: ({ match }) => ({
    meta: [
      { title: "Authentic Hadith Collections — Bukhari, Muslim & Sunan | Alaq" },
      { name: "description", content: "Read Sahih al-Bukhari, Sahih Muslim, the four Sunan, Muwatta Malik, An-Nawawi's Forty and Hadith Qudsi in Arabic and English." },
      { property: "og:title", content: "Authentic Hadith Collections | Alaq" },
      { property: "og:description", content: "The six major books of hadith and more, in Arabic and English with grades." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: HadithIndex,
});

function HadithIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <PageHeader eyebrow="As-Sunnah" title="Hadith collections">
        The six major books (Kutub as-Sittah) and classic collections, in Arabic and English. Grades from recognised
        scholars are shown where the collection is not entirely sahih.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((c) => {
          const info = collectionInfo(c.key);
          return (
            <Link
              key={c.key}
              to="/hadith/$collection"
              params={{ collection: c.key }}
              className="group flex flex-col rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{info.tag}</span>
                <span className="text-xs text-muted-foreground">{c.total.toLocaleString()} hadith</span>
              </div>
              <p className="quran-text mt-4 text-right text-2xl text-primary">{info.arabic}</p>
              <p className="mt-1 font-display text-xl font-semibold">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{info.blurb}</p>
              <p className="mt-auto pt-4 text-xs text-muted-foreground">{info.compiler}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
