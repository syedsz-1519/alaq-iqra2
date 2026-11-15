import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BookOpenCheck, Headphones, Loader2, Mic, PhoneOff, Repeat2, MessagesSquare, WifiOff } from "lucide-react";
import { shareImage } from "@/lib/share";
import { useAuth } from "@/lib/auth";
import { TEACHER_LANGUAGES } from "@/lib/teachers";
import { TRACKS, lessonsFor, type Lesson, type TrackId } from "@/lib/zaid-lessons";
import { useZaid } from "@/components/alaq/zaid-provider";
import { TeacherBadge, TeacherPicker } from "@/components/alaq/teacher-ui";
import { OfflineLesson } from "@/components/alaq/offline-lesson";
import { TAJWEED_TOPICS } from "@/lib/tajweed-notes";
import { useOnline } from "@/hooks/use-online";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn")({
  head: ({ match }) => ({
    meta: [
      { title: "Lessons with Zaid or Zara — Tajweed, Arabic & Fiqh | Alaq" },
      { name: "description", content: "Step-by-step voice lessons in Tajweed, Quranic Arabic and Fiqh with a polite, patient teacher — in English, Hindi, Urdu, Telugu, Marathi or Hyderabadi Roman Urdu." },
      { property: "og:title", content: "Voice lessons with Zaid or Zara — Alaq" },
      { property: "og:description", content: "Tajweed, Arabic and Fiqh lessons and repeat-after-me Quran practice, spoken in your language." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { user, ready } = useAuth();
  const z = useZaid();
  const navigate = useNavigate();
  const [track, setTrack] = useState<TrackId>("tajweed");
  const [reading, setReading] = useState<string | null>(null);
  const online = useOnline();
  const t = z.teacher;
  const topicFor = (l: Lesson) => (l.track === "tajweed" ? TAJWEED_TOPICS.find((x) => `tajweed-${x.id}` === l.id) : undefined);

  const start = (lesson?: Lesson) => {
    if (!user) return void navigate({ to: "/auth", search: { redirect: "/learn" } });
    z.setPanelOpen(true);
    if (z.idle) z.begin(lesson ? { lesson: lesson.id } : undefined);
  };
  const active = TRACKS.find((x) => x.id === track)!;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <section className="bg-hero relative overflow-hidden rounded-[2rem] px-6 py-9 text-night-foreground shadow-elegant md:px-10">
        <div className="girih pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Your voice teacher</p>
            <h1 className="mt-2 font-display text-3xl font-semibold md:text-5xl">Learn with {t.name}</h1>
            <p className="mt-3 max-w-lg opacity-85">
              A gentle, patient teacher who listens, explains and corrects you kindly. Speak in{" "}
              {TEACHER_LANGUAGES.slice(0, -1).join(", ")} or {TEACHER_LANGUAGES.at(-1)} — {t.name} replies in the same language.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {z.live ? (
                <Button onClick={() => z.voice.stop()} variant="secondary" className="rounded-full">
                  <PhoneOff /> End the lesson
                </Button>
              ) : (
                <Button onClick={() => start()} disabled={!ready || !z.idle} className="bg-gold-gradient rounded-full text-gold-foreground shadow-glow hover:opacity-95">
                  {!z.idle ? <Loader2 className="animate-spin" /> : <Mic />} {user ? `Talk to ${t.name}` : `Sign in to talk to ${t.name}`}
                </Button>
              )}
              <Link to="/repeat" className="inline-flex items-center gap-2 rounded-full border border-night-foreground/25 px-4 py-2 text-sm font-medium hover:bg-night-foreground/10">
                <Repeat2 className="size-4" /> Repeat after {t.name}
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-night-foreground/15 bg-night-foreground/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <TeacherBadge teacher={t} className="size-12" />
              <div>
                <p className="text-sm font-semibold">Choose your teacher</p>
                <p className="text-xs opacity-75">Zaid has a male voice, Zara a female voice.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-card p-2 text-foreground">
              <TeacherPicker disabled={!z.idle} />
            </div>
            {!z.idle && <p className="mt-2 text-xs opacity-75">End the lesson to switch teacher.</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <PracticeCard to="/repeat" icon={Repeat2} title={`Repeat after ${t.name}`} text="Hear an ayah phrase by phrase and say it back — the best way to memorise." />
        <PracticeCard to="/assignments" icon={BookOpenCheck} title="Recite & get checked" text={`Recite a passage and ${t.name} gently points out what to fix.`} />
        <PracticeCard to="/zaid" icon={MessagesSquare} title="Ask anything" text="Hadith, duas, the nafs, Islamic content — talk freely by topic." />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Lessons</h2>
        <p className="mb-4 text-sm text-muted-foreground">Pick a lesson and {t.name} will teach it step by step, then practise it with you.</p>
        <div role="tablist" aria-label="Lesson tracks" className="flex flex-wrap gap-2">
          {TRACKS.map((x) => (
            <button
              key={x.id}
              role="tab"
              type="button"
              aria-selected={track === x.id}
              onClick={() => setTrack(x.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                track === x.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className="quran-text text-base leading-none">{x.arabic}</span> {x.title}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{active.blurb}</p>
        {track === "tajweed" && (
          <p className="mt-3 inline-flex items-start gap-2 rounded-2xl bg-accent px-3 py-2 text-xs text-accent-foreground">
            <Headphones className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Tap <b className="font-semibold">Listen</b> on any Tajweed lesson to hear {t.name} read it with your phone's own voice — no internet or sign-in needed.
            </span>
          </p>
        )}
        {!online && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-gold/20 px-3 py-2 text-xs font-medium">
            <WifiOff className="size-3.5 shrink-0" /> You're offline. Live lessons need internet; Tajweed lessons still play with your phone's voice.
          </p>
        )}

        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {lessonsFor(track).map((l, i) => {
            const current = z.lesson?.id === l.id && !z.idle;
            const topic = topicFor(l);
            return (
              <li key={l.id} className={cn("rounded-2xl border bg-card p-4", current ? "border-gold bg-gold/10" : "border-border", reading === l.id && "md:col-span-2")}>
              <div className="flex gap-3 sm:gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold">{l.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{l.summary}</p>
                  {l.practice.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {l.practice.map((p) => (
                        <Link
                          key={`${p.surah}:${p.ayah}`}
                          to="/repeat"
                          search={{ surah: p.surah, ayah: p.ayah }}
                          className="rounded-full border border-border px-2 py-0.5 tabular-nums text-primary hover:bg-secondary"
                          title="Practise this ayah: repeat after your teacher"
                        >
                          {p.surah}:{p.ayah}
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5 self-center">
                  <Button
                    size="sm"
                    variant={current ? "secondary" : "default"}
                    className="rounded-full"
                    disabled={!ready || !online || (!z.idle && !current)}
                    title={online ? undefined : "Live lessons need internet"}
                    onClick={() => (current ? z.setPanelOpen(true) : start(l))}
                  >
                    {current ? "In lesson" : "Start"} <ArrowRight />
                  </Button>
                  {topic && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      aria-expanded={reading === l.id}
                      onClick={() => setReading((r) => (r === l.id ? null : l.id))}
                    >
                      <Headphones /> Listen
                    </Button>
                  )}
                </div>
              </div>
              {topic && reading === l.id && <OfflineLesson topic={topic} teacher={t} onClose={() => setReading(null)} />}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function PracticeCard({ to, icon: Icon, title, text }: { to: "/repeat" | "/assignments" | "/zaid"; icon: typeof Mic; title: string; text: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-elegant">
      <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}
