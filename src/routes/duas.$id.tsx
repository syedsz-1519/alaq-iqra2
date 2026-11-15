import { shareImage } from "@/lib/share";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { DUA_CATEGORIES, getDuaCategoryMeta, loadDuaCategory, type DuaItem } from "@/lib/duas";
import { playableUrl } from "@/lib/offline-cache";
import { PageHeader } from "@/components/alaq/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/duas/$id")({
  loader: async ({ params }) => {
    const cat = await loadDuaCategory(Number(params.id));
    if (!cat) throw notFound();
    return cat;
  },
  head: ({ params, match }) => {
    const meta = getDuaCategoryMeta(Number(params.id));
    const title = meta ? `${meta.title} — Hisnul Muslim | Alaq` : "Dua | Alaq";
    const description = meta
      ? `${meta.title}: authentic dua in Arabic with transliteration, meaning and audio.`
      : "Authentic duas from Hisnul Muslim.";
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
  component: DuaPage,
});

function DuaPage() {
  const cat = Route.useLoaderData();
  const pos = DUA_CATEGORIES.findIndex((c) => c.id === cat.id);
  const prev = DUA_CATEGORIES[pos - 1];
  const next = DUA_CATEGORIES[pos + 1];
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  const play = async (d: DuaItem) => {
    if (!audio.current) audio.current = new Audio();
    const el = audio.current;
    if (playing === d.id) {
      el.pause();
      setPlaying(null);
      return;
    }
    el.src = await playableUrl(d.audio);
    el.onended = () => setPlaying(null);
    el.onerror = () => {
      setPlaying(null);
      toast.error("Audio isn't available right now.");
    };
    el.play().then(() => setPlaying(d.id)).catch(() => setPlaying(null));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <Link to="/duas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> All duas
      </Link>
      <PageHeader eyebrow={`Hisnul Muslim · Chapter ${cat.id}`} title={cat.title} />

      <div className="space-y-4">
        {cat.items.map((d, i) => (
          <DuaCard key={d.id} d={d} index={i + 1} playing={playing === d.id} onPlay={() => play(d)} />
        ))}
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link to="/duas/$id" params={{ id: String(prev.id) }} className="rounded-2xl border border-border bg-card p-4 hover:bg-secondary">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="line-clamp-1 font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to="/duas/$id" params={{ id: String(next.id) }} className="rounded-2xl border border-border bg-card p-4 text-right hover:bg-secondary">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="line-clamp-1 font-medium">{next.title}</span>
          </Link>
        )}
      </nav>

      <p className="mt-8 rounded-2xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
        Source: <em>Hisn al-Muslim (Fortress of the Muslim)</em> by Sa'id ibn Ali ibn Wahf al-Qahtani, text and audio via{" "}
        <a className="underline underline-offset-2" href="https://www.hisnmuslim.com" target="_blank" rel="noreferrer">
          HisnMuslim.com
        </a>
        . Each dua's hadith reference appears in the original book.{" "}
        <Link to="/sources" className="underline underline-offset-2">
          All sources
        </Link>
      </p>
    </div>
  );
}

function DuaCard({ d, index, playing, onPlay }: { d: DuaItem; index: number; playing: boolean; onPlay: () => void }) {
  const [count, setCount] = useState(0);
  const done = d.repeat > 1 && count >= d.repeat;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${d.arabic}\n\n${d.transliteration}\n\n${d.translation}\n\n— Hisnul Muslim`);
      toast.success("Dua copied");
    } catch {
      toast.error("Couldn't copy on this device");
    }
  };
  return (
    <article className={cn("rounded-2xl border bg-card p-5 transition-colors", done ? "border-primary/50" : "border-border")}>
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">#{index}</span>
        {d.repeat > 1 && (
          <span className="rounded-full bg-gold/20 px-2.5 py-1 text-xs font-medium">Recite {d.repeat}×</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {d.audio && (
            <button
              type="button"
              aria-label={playing ? "Pause audio" : "Play audio"}
              onClick={onPlay}
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          )}
          <button
            type="button"
            aria-label="Copy dua"
            onClick={copy}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </div>
      <p className="quran-text text-right text-2xl">{d.arabic}</p>
      {d.transliteration && <p className="mt-3 text-sm italic text-muted-foreground">{d.transliteration}</p>}
      {d.translation && <p className="mt-2 leading-relaxed">{d.translation}</p>}
      {d.repeat > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(d.repeat, c + 1))}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors",
              done ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
            )}
          >
            {done ? "Completed ✓" : `Count ${count} / ${d.repeat}`}
          </button>
          <button
            type="button"
            aria-label="Reset count"
            onClick={() => setCount(0)}
            className="grid size-10 place-items-center rounded-xl border border-border hover:bg-secondary"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      )}
    </article>
  );
}
