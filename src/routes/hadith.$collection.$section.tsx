import { shareImage } from "@/lib/share";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  HADITH_LANGS,
  HADITH_URDU_COLLECTIONS,
  collectionInfo,
  getCollection,
  hadithSectionQuery,
  hadithUrduQuery,
  type Hadith,
  type HadithLang,
} from "@/lib/hadith";
import { useStored } from "@/lib/storage";
import { LangBar, ListenButton, TranslateButton, isAiLang, useSavedTranslations } from "@/components/alaq/hadith-tools";
import { ErrorNotice, PageHeader } from "@/components/alaq/app-shell";
import { OfflineIndicator } from "@/components/alaq/offline-badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hadith/$collection/$section")({
  loader: async ({ params, context }) => {
    const c = getCollection(params.collection);
    const n = Number(params.section);
    const s = c?.sections.find((x) => x.n === n);
    if (!c || !s) throw notFound();
    await context.queryClient.ensureQueryData(hadithSectionQuery(c.key, n));
    return { collection: c.name, book: s.name };
  },
  head: ({ loaderData, match }) => {
    const title = loaderData ? `${loaderData.book} — ${loaderData.collection} | Alaq` : "Hadith | Alaq";
    const description = loaderData
      ? `Read the hadith of “${loaderData.book}” from ${loaderData.collection} in Arabic and English.`
      : "Read authentic hadith.";
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
  errorComponent: SectionError,
  component: SectionPage,
});

function SectionError() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <ErrorNotice message="These hadith couldn't be loaded." onRetry={() => router.invalidate()} />
    </div>
  );
}

const PAGE = 20;

/** Keeps the ﷺ ligature at text size (fallback fonts draw it very large). */
function withHonorific(text: string) {
  const parts = text.split("ﷺ");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="inline-block align-middle text-[0.8em] leading-none" style={{ fontFamily: "var(--font-naskh)" }}>
          ﷺ
        </span>
      )}
    </span>
  ));
}

function gradeTone(grade: string) {
  const g = grade.toLowerCase();
  if (g.includes("sahih")) return "bg-accent text-accent-foreground";
  if (g.includes("hasan")) return "bg-gold/20 text-foreground";
  if (g.includes("da") || g.includes("weak") || g.includes("mawdu")) return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
}

function SectionPage() {
  const { collection, section } = Route.useParams();
  const c = getCollection(collection)!;
  const n = Number(section);
  const s = c.sections.find((x) => x.n === n) ?? { n, name: "", first: 0, last: 0 };
  const idx = c.sections.findIndex((x) => x.n === n);
  const prev = c.sections[idx - 1];
  const next = c.sections[idx + 1];
  const { data } = useSuspenseQuery(hadithSectionQuery(c.key, n));
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [showArabic, setShowArabic] = useState(true);
  const hasUrdu = HADITH_URDU_COLLECTIONS.includes(c.key);
  const [storedLang, setLang] = useStored<HadithLang>("alaq:hadith-lang", "en");
  const lang: HadithLang = storedLang === "ur" && !hasUrdu ? "en" : storedLang;
  const langInfo = HADITH_LANGS.find((l) => l.id === lang) ?? HADITH_LANGS[0]!;
  const urdu = useQuery({ ...hadithUrduQuery(c.key, n), enabled: lang === "ur" && hasUrdu });
  const first = data[0]?.hadithnumber ?? 0;
  const last = data[data.length - 1]?.hadithnumber ?? 0;
  const saved = useSavedTranslations(c.key, lang, first, last);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data;
    return data.filter((h) => h.text.toLowerCase().includes(t) || String(h.hadithnumber) === t);
  }, [data, q]);

  const copy = async (h: Hadith) => {
    const text = `${h.arabic ? h.arabic + "\n\n" : ""}${h.text}\n\n— ${c.name} ${h.hadithnumber}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Hadith copied");
    } catch {
      toast.error("Couldn't copy on this device");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <OfflineIndicator className="mb-4 w-fit" />
      <Link
        to="/hadith/$collection"
        params={{ collection: c.key }}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> {c.name}
      </Link>
      <PageHeader eyebrow={`${collectionInfo(c.key).arabic} · Book ${s.n}`} title={s.name}>
        {data.length} hadith
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search in this book"
            className="bg-card pl-9"
            aria-label="Search hadith"
          />
        </div>
        <Button variant="outline" size="sm" className="bg-card" onClick={() => setShowArabic((v) => !v)}>
          {showArabic ? "Hide Arabic" : "Show Arabic"}
        </Button>
      </div>
      <div className="mb-5 space-y-2">
        <LangBar value={lang} onChange={setLang} urdu={hasUrdu} />
        {langInfo.ai && (
          <p className="text-xs text-muted-foreground">
            {langInfo.label} has no published hadith edition, so these are AI translations of the published English — check important wording with a scholar.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {filtered.slice(0, limit).map((h) => (
          <article key={h.hadithnumber} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                {c.name} {h.hadithnumber}
              </span>
              {h.grades?.slice(0, 2).map((g) => (
                <span key={g.name + g.grade} className={cn("rounded-full px-2.5 py-1 text-xs font-medium", gradeTone(g.grade))} title={`Graded by ${g.name}`}>
                  {g.grade} <span className="opacity-70">· {g.name}</span>
                </span>
              ))}
              <button
                type="button"
                aria-label="Copy hadith"
                onClick={() => copy(h)}
                className="ml-auto grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Copy className="size-4" />
              </button>
            </div>
            {showArabic && h.arabic && (
              <p className="mb-3 text-right text-xl leading-[2.1]" dir="rtl" style={{ fontFamily: "var(--font-naskh)" }}>
                {h.arabic}
              </p>
            )}
            {lang === "en" && <p className="leading-relaxed text-foreground/90">{withHonorific(h.text)}</p>}
            {lang === "ur" &&
              (urdu.data?.[h.hadithnumber] ? (
                <p dir="rtl" lang="ur" className="text-right text-lg leading-[2.2]" style={{ fontFamily: "var(--font-urdu, var(--font-naskh))" }}>
                  {urdu.data[h.hadithnumber]}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{urdu.isLoading ? "Loading Urdu…" : "No Urdu text for this hadith."}</p>
              ))}
            {isAiLang(lang) &&
              (saved.data?.[h.hadithnumber] ? (
                <p lang={lang === "roman" ? "ur-Latn" : lang} className="leading-relaxed text-foreground/90">
                  {saved.data[h.hadithnumber]}
                  <span className="ml-2 align-middle text-[0.7rem] text-muted-foreground">AI translation</span>
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="leading-relaxed text-foreground/70">{withHonorific(h.text)}</p>
                  <TranslateButton collection={c.key} number={h.hadithnumber} lang={lang} first={first} last={last} />
                </div>
              ))}
            <div className="mt-3 flex flex-wrap gap-2">
              {h.arabic && <ListenButton collection={c.key} number={h.hadithnumber} lang="ar" label="Arabic" />}
              <ListenButton collection={c.key} number={h.hadithnumber} lang={lang} label={langInfo.label} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Reference: Book {h.reference.book}, Hadith {h.reference.hadith} · Arabic no. {String(h.arabicnumber)}
            </p>
          </article>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">Nothing matches “{q}” in this book.</p>}
      </div>

      {filtered.length > limit && (
        <div className="mt-6 text-center">
          <Button onClick={() => setLimit((l) => l + PAGE)}>Show more ({filtered.length - limit} left)</Button>
        </div>
      )}

      <nav className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            to="/hadith/$collection/$section"
            params={{ collection: c.key, section: String(prev.n) }}
            className="rounded-2xl border border-border bg-card p-4 hover:bg-secondary"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous book
            </span>
            <span className="line-clamp-1 font-medium">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to="/hadith/$collection/$section"
            params={{ collection: c.key, section: String(next.n) }}
            className="rounded-2xl border border-border bg-card p-4 text-right hover:bg-secondary"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next book <ChevronRight className="size-3.5" />
            </span>
            <span className="line-clamp-1 font-medium">{next.name}</span>
          </Link>
        )}
      </nav>

      <p className="mt-8 rounded-2xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
        Text from the open{" "}
        <a className="underline underline-offset-2" href="https://github.com/fawazahmed0/hadith-api" target="_blank" rel="noreferrer">
          Hadith API
        </a>{" "}
        (compiled from sunnah.com-referenced editions). Verify rulings with a qualified scholar.{" "}
        <Link to="/sources" className="underline underline-offset-2">
          All sources
        </Link>
      </p>
    </div>
  );
}
