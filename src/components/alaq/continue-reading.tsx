import { Link } from "@tanstack/react-router";
import { BookOpen, Headphones, Play } from "lucide-react";
import { isFinished, useLastRead } from "@/lib/reading";
import { reciterName } from "@/lib/quran";
import { useAudioPlayer } from "./audio-player";
import { cn } from "@/lib/utils";

export function ContinueReadingCard({ className }: { className?: string }) {
  const [last] = useLastRead();
  if (!last) return null;
  const pct = Math.round((last.ayah / last.total) * 100);
  // Finished a surah: carry on with the next one.
  const next = isFinished(last) && last.surah < 114 ? last.surah + 1 : null;
  return (
    <Link
      to="/quran/$surah"
      params={{ surah: String(next ?? last.surah) }}
      search={next ? {} : { ayah: last.ayah }}
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/60",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <BookOpen className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Continue reading</p>
        <p className="truncate font-display font-semibold">
          {next ? `Finished ${last.englishName} · Start Surah ${next}` : `${last.englishName} · Ayah ${last.ayah} of ${last.total}`}
        </p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="quran-text hidden text-xl text-primary sm:block">{last.name.replace("سُورَةُ ", "")}</span>
    </Link>
  );
}

export function ResumeListeningCard({ className }: { className?: string }) {
  const p = useAudioPlayer();
  const s = p.saved;
  if (!s || p.surah) return null;
  return (
    <button
      type="button"
      onClick={p.resume}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/60",
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold text-gold-foreground">
        <Headphones className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Resume listening</p>
        <p className="truncate font-display font-semibold">
          {s.englishName} · Ayah {s.ayah} of {s.total}
        </p>
        <p className="truncate text-xs text-muted-foreground">{reciterName(s.reciter)}</p>
      </div>
      <Play className="size-5 text-primary" />
    </button>
  );
}
