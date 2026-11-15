import { Link } from "@tanstack/react-router";
import { Loader2, Pause, Play, Repeat1, SkipBack, SkipForward, X } from "lucide-react";
import { useAudioPlayer } from "./audio-player";
import { LANGS, reciterName } from "@/lib/quran";
import { ReciterSelect } from "./reciter-select";
import { cn } from "@/lib/utils";

export function MiniPlayer() {
  const p = useAudioPlayer();
  if (!p.surah) return null;
  const ayah = p.ayahs[p.index]?.numberInSurah ?? 1;
  const pct = p.duration ? (p.progress / p.duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-[4.25rem] z-40 px-3 lg:bottom-4">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-ink text-ink-foreground shadow-2xl">
        <div className="h-1 w-full bg-ink-foreground/15">
          <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Link to="/listen/$surah" params={{ surah: String(p.surah) }} className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold">
              {p.englishName} <span className="font-sans font-normal opacity-70">· Ayah {ayah} of {p.ayahs.length}</span>
            </p>
            <p className="truncate text-xs opacity-70">
              {p.speakingTranslation && p.voiceTranslation !== "none" ? (
                <span className="text-gold">Translation · {LANGS[p.voiceTranslation].label}</span>
              ) : (
                reciterName(p.reciter)
              )}
            </p>
          </Link>
          <div className="flex items-center gap-1">
            <IconBtn label="Previous ayah" onClick={p.prev}>
              <SkipBack className="size-4" />
            </IconBtn>
            <button
              type="button"
              aria-label={p.playing ? "Pause" : "Play"}
              onClick={p.toggle}
              className="grid size-10 place-items-center rounded-full bg-gold text-gold-foreground transition-transform active:scale-95"
            >
              {p.loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : p.playing ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 translate-x-px" />
              )}
            </button>
            <IconBtn label="Next ayah" onClick={p.next}>
              <SkipForward className="size-4" />
            </IconBtn>
            <IconBtn
              label="Repeat this ayah"
              onClick={() => p.setRepeatAyah(!p.repeatAyah)}
              className={cn("hidden sm:grid", p.repeatAyah && "bg-ink-foreground/20 text-gold")}
            >
              <Repeat1 className="size-4" />
            </IconBtn>
            <div className="hidden w-44 sm:block">
              <ReciterSelect value={p.reciter} onChange={(id) => p.setReciter(id)} variant="ink" />
            </div>
            <IconBtn label="Close player" onClick={p.close}>
              <X className="size-4" />
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("grid size-8 place-items-center rounded-full transition-colors hover:bg-ink-foreground/15", className)}
    >
      {children}
    </button>
  );
}
