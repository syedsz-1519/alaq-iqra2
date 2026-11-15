import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LogIn, Maximize2, Mic, MicOff, PhoneOff, Volume2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ZAID_TOPICS } from "@/lib/zaid-topics";
import { cn } from "@/lib/utils";
import { useStored } from "@/lib/storage";
import { BUBBLE_SIZE, DEFAULT_SPOT, clampDrag, isBubbleSpot, restingXY, spotFromDrop, type BubbleSpot } from "@/lib/bubble-position";
import { useZaid } from "./zaid-provider";
import { TeacherBadge, TeacherPicker } from "./teacher-ui";

const HIDDEN_ON = ["/zaid", "/learn", "/auth", "/reset-password"];

const SPOT_KEY = "alaq:bubble-spot";

function useViewport() {
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const read = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return vp;
}

/** Floating voice-assistant bubble: talk to Zaid or Zara from any page. Drag it anywhere; it snaps to the nearest edge. */

export function ZaidBubble() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { ready, user } = useAuth();
  const z = useZaid();
  const open = z.panelOpen;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => z.setPanelOpen(typeof v === "function" ? v(open) : v);
  const navigate = useNavigate();
  const name = z.teacher.name;
  const inCall = !z.idle;
  const vpState = useViewport();
  const [stored, setStored] = useStored<BubbleSpot>(SPOT_KEY, DEFAULT_SPOT);
  const spot = isBubbleSpot(stored) ? stored : DEFAULT_SPOT;
  const [drag, setDrag] = useState<{ dx: number; dy: number; sx: number; sy: number; x: number; y: number; moved: boolean } | null>(null);

  if (HIDDEN_ON.includes(pathname) || !vpState) return null;
  const vp = vpState;
  const rest = restingXY(spot, vp.w, vp.h);
  const pos = drag ? { x: drag.x, y: drag.y } : rest;

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ dx: e.clientX - rest.x, dy: e.clientY - rest.y, sx: e.clientX, sy: e.clientY, x: rest.x, y: rest.y, moved: false });
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const moved = drag.moved || Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6;
    const next = clampDrag(e.clientX - drag.dx, e.clientY - drag.dy, vp.w, vp.h);
    setDrag({ ...drag, ...next, moved });
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag.moved) {
      setStored(spotFromDrop(drag.x, drag.y, vp.w, vp.h));
    } else {
      onBubble();
    }
    setDrag(null);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = 0.08;
    if (e.key === "ArrowUp") setStored({ ...spot, y: Math.max(0, spot.y - step) });
    else if (e.key === "ArrowDown") setStored({ ...spot, y: Math.min(1, spot.y + step) });
    else if (e.key === "ArrowLeft") setStored({ ...spot, side: "left" });
    else if (e.key === "ArrowRight") setStored({ ...spot, side: "right" });
    else return;
    e.preventDefault();
  };
  // Idle: the bubble opens the teacher's own page (preferences + lessons). In a call: the call controls.
  const onBubble = () => (inCall ? setOpen((v) => !v) : void navigate({ to: "/learn" }));
  const lastZaid = [...z.captions].reverse().find((c) => c.role === "assistant");

  return (
    <div
      className={cn("fixed left-0 top-0 z-50", !drag && "transition-transform duration-300 ease-out")}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, width: BUBBLE_SIZE }}
    >
      {open && inCall && (
        <div
          className={cn(
            "animate-fade-up absolute w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-border bg-card shadow-elegant",
            spot.side === "right" ? "right-0" : "left-0",
            pos.y > vp.h / 2 ? "bottom-[calc(100%+0.75rem)]" : "top-[calc(100%+0.75rem)]",
          )}
        >
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={onKey}
        onClick={(e) => {
          // Keyboard, screen readers and switch access send a click without pointer movement.
          if (e.detail === 0) onBubble();
        }}
        aria-label={`${inCall ? (open ? `Hide the call with ${name}` : `Show the call with ${name}`) : `Open ${name}, your voice teacher`}. Drag, or use arrow keys, to move.`}
        aria-expanded={inCall ? open : undefined}
        title={`${name} · drag to move`}
        className={cn(
          "teacher-ring group relative grid touch-none select-none place-items-center rounded-full p-[3px] transition-transform",
          drag?.moved ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105 active:scale-95",
        )}
        style={{ width: BUBBLE_SIZE, height: BUBBLE_SIZE }}
      >
        {z.live && <span className="animate-pulse-ring absolute -inset-1 rounded-full border-2 border-gold/60" />}
        <TeacherBadge teacher={z.teacher} className="size-full border-0 shadow-none" />
        <span className="bg-gold-gradient absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-gold-foreground ring-2 ring-background">
          <Mic className="size-3" />
        </span>
      </button>
      <span
        aria-hidden
        className="bubble-chip pointer-events-none absolute left-1/2 top-[calc(100%+0.25rem)] -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      >
        {z.live ? "Listening" : inCall ? "Connecting" : name}
      </span>
    </div>
  );
}
