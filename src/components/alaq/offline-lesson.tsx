import { useMemo } from "react";
import { Pause, Play, Square, Volume2, WifiOff } from "lucide-react";
import { tajweedLessonScript } from "@/lib/device-voice";
import type { TajweedTopic } from "@/lib/tajweed-notes";
import type { Teacher } from "@/lib/teachers";
import { useDeviceSpeech } from "@/hooks/use-device-speech";
import { cn } from "@/lib/utils";

const RATES = [0.8, 0.95, 1.1] as const;

/** A Tajweed lesson read aloud by the phone's own voice — no internet or sign-in needed. */
export function OfflineLesson({ topic, teacher, onClose }: { topic: TajweedTopic; teacher: Teacher; onClose: () => void }) {
  const speech = useDeviceSpeech(teacher.id === "zara" ? "female" : "male");
  const parts = useMemo(() => tajweedLessonScript(topic, teacher), [topic, teacher]);

  if (!speech.supported) {
    return (
      <div className="offline-lesson mt-3 rounded-2xl p-4 text-sm">
        This phone's browser can't read text aloud. Open Alaq in Chrome or Safari to hear offline lessons.
      </div>
    );
  }

  const start = () => speech.play(parts);
  return (
    <div className="offline-lesson mt-3 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        {!speech.playing ? (
          <button type="button" onClick={start} className="bg-gold-gradient inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-gold-foreground shadow-glow">
            <Play className="size-4" /> Play lesson
          </button>
        ) : speech.paused ? (
          <button type="button" onClick={speech.resume} className="bg-gold-gradient inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-gold-foreground">
            <Play className="size-4" /> Resume
          </button>
        ) : (
          <button type="button" onClick={speech.pause} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Pause className="size-4" /> Pause
          </button>
        )}
        {speech.playing && (
          <button type="button" onClick={speech.stop} aria-label="Stop lesson" className="grid size-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary">
            <Square className="size-4" />
          </button>
        )}
        <div role="group" aria-label="Speaking speed" className="ml-auto inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
          {RATES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={speech.rate === r}
              onClick={() => speech.changeRate(r)}
              className={cn("rounded-full px-2.5 py-1 font-medium", speech.rate === r ? "bg-secondary text-foreground" : "text-muted-foreground")}
            >
              {r === 0.8 ? "Slow" : r === 0.95 ? "Normal" : "Fast"}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-4 space-y-1.5 text-sm leading-relaxed" aria-live="polite">
        {parts.map((p, i) => (
            <li
              key={i}
              dir={p.lang === "ar" ? "rtl" : "ltr"}
              className={cn(
                "rounded-lg px-2 py-1 transition-colors",
                p.lang === "ar" && "quran-text text-center text-2xl",
                p.kind === "remember" && "font-medium text-primary",
                p.kind === "note" && "text-xs text-muted-foreground",
                speech.index === i ? "bg-gold/20 text-foreground" : speech.playing ? "text-muted-foreground" : "",
              )}
            >
              <button type="button" onClick={() => speech.play(parts, i)} className="w-full text-inherit" style={{ textAlign: "inherit" }}>
                {p.text}
              </button>
            </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {speech.hasLocalVoice ? <WifiOff className="size-3" /> : <Volume2 className="size-3" />}
          {speech.hasLocalVoice ? "Uses your phone's voice · works offline" : "Uses your phone's voice"}
        </span>
        <button type="button" onClick={() => { speech.stop(); onClose(); }} className="underline">
          Close
        </button>
      </div>
    </div>
  );
}
