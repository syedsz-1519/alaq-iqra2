import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogIn, Maximize2, Mic, MicOff, PhoneOff, Volume2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ZAID_TOPICS } from "@/lib/zaid-topics";
import { cn } from "@/lib/utils";
import { useZaid } from "./zaid-provider";
import { TeacherBadge, TeacherPicker } from "./teacher-ui";

const HIDDEN_ON = ["/zaid", "/learn", "/auth", "/reset-password"];

/** Floating voice-assistant bubble: talk to Zaid or Zara from any page. */

export function ZaidBubble() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { ready, user } = useAuth();
  const z = useZaid();
  const open = z.panelOpen;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => z.setPanelOpen(typeof v === "function" ? v(open) : v);
  const navigate = useNavigate();
  const name = z.teacher.name;
  const inCall = !z.idle;
  if (HIDDEN_ON.includes(pathname)) return null;
  // Idle: the bubble opens the teacher's own page (preferences + lessons). In a call: the call controls.
  const onBubble = () => (inCall ? setOpen((v) => !v) : void navigate({ to: "/learn" }));
  const lastZaid = [...z.captions].reverse().find((c) => c.role === "assistant");

  return (
    <div className="fixed bottom-[8.75rem] right-4 z-50 flex flex-col items-end gap-3 lg:bottom-24 lg:right-6">
      {open && inCall && (
        <div className="animate-fade-up w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
          <div className="bg-hero relative px-5 pb-5 pt-4 text-night-foreground">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{name} · your teacher</p>
              <div className="flex items-center gap-1">
                <Link to="/learn" onClick={() => setOpen(false)} aria-label={`Open ${name}'s page`} className="grid size-8 place-items-center rounded-full hover:bg-night-foreground/10">
                  <Maximize2 className="size-4" />
                </Link>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full hover:bg-night-foreground/10">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative grid size-16 shrink-0 place-items-center">
                {z.live && <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-gold/60" />}
                <TeacherBadge teacher={z.teacher} className="relative size-14" />
              </div>
              <p role="status" className="text-sm opacity-90">{z.statusText}</p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            {lastZaid ? (
              <p dir="auto" className="line-clamp-4 rounded-2xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">{lastZaid.text}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ask about Quran, Tajweed, Arabic, hadith, duas or fiqh — in English, Hindi, Urdu, Telugu, Marathi or Roman Urdu.
              </p>
            )}

            {z.idle && <TeacherPicker compact />}
            {z.lesson && !z.idle && <p className="text-xs text-muted-foreground">Lesson: {z.lesson.title}</p>}
            {z.idle && (
              <label className="block text-xs font-medium text-muted-foreground">
                Lesson
                <select
                  value={z.topic}
                  onChange={(e) => z.setTopic(e.target.value as typeof z.topic)}
                  className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-2 text-sm text-foreground"
                >
                  {ZAID_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!ready ? null : !user ? (
              <Link to="/auth" search={{ redirect: pathname }} onClick={() => setOpen(false)} className="bg-gold-gradient flex h-11 items-center justify-center gap-2 rounded-full font-semibold text-gold-foreground">
                <LogIn className="size-4" /> Sign in to talk with {name}
              </Link>
            ) : z.idle ? (
              <button type="button" onClick={() => z.begin()} className="bg-gold-gradient flex h-11 w-full items-center justify-center gap-2 rounded-full font-semibold text-gold-foreground shadow-glow">
                <Mic className="size-4" /> {z.voice.hasConnected ? "Start a new lesson" : "Start talking"}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!z.live}
                  onClick={() => z.voice.setMuted(!z.voice.muted)}
                  aria-label={z.voice.muted ? "Unmute microphone" : "Mute microphone"}
                  className="grid size-11 place-items-center rounded-full border border-border hover:bg-secondary disabled:opacity-50"
                >
                  {z.voice.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>
                <button
                  type="button"
                  disabled={z.voice.status === "stopping"}
                  onClick={z.voice.stop}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-destructive font-semibold text-destructive-foreground disabled:opacity-60"
                >
                  <PhoneOff className="size-4" /> End
                </button>
              </div>
            )}
            {z.voice.playbackBlocked && (
              <button type="button" onClick={z.voice.resumePlayback} className="flex items-center gap-2 text-sm text-primary underline">
                <Volume2 className="size-4" /> Tap to hear {name}
              </button>
            )}
            {z.voice.error && <p role="alert" className="text-xs text-destructive">{z.voice.error}</p>}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBubble}
        aria-label={inCall ? (open ? `Hide the call with ${name}` : `Show the call with ${name}`) : `Open ${name}, your voice teacher`}
        aria-expanded={inCall ? open : undefined}
        className="group flex items-center gap-2.5 rounded-full p-1 pl-4 shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95 bg-hero text-night-foreground"
      >
        <span className="flex flex-col items-start leading-tight">
          <span className="text-gold-gradient font-display text-base font-semibold">{name}</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] opacity-75">
            {z.live ? "Listening…" : inCall ? "Connecting…" : "Your teacher"}
          </span>
        </span>
        <span className="teacher-ring relative grid size-14 place-items-center rounded-full p-[3px]">
          {z.live && <span className="animate-pulse-ring absolute -inset-1 rounded-full border-2 border-gold/60" />}
          <TeacherBadge teacher={z.teacher} className="size-full border-0 shadow-none" />
          <span className="bg-gold-gradient absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-gold-foreground ring-2 ring-background">
            <Mic className="size-3" />
          </span>
        </span>
      </button>
    </div>
  );
}
