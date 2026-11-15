import { shareImage } from "@/lib/share";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ArrowRight, BookOpen, Loader2, LogIn, Mic, MicOff, PhoneOff, Sparkles, Volume2 } from "lucide-react";
import { TeacherBadge, TeacherPicker } from "@/components/alaq/teacher-ui";
import { useZaid } from "@/components/alaq/zaid-provider";
import { useAuth, firstName } from "@/lib/auth";
import { ZAID_TOPICS, getZaidTopic } from "@/lib/zaid-topics";
import type { ZaidReference } from "@/lib/zaid-tools.server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/zaid")({
  head: ({ match }) => ({
    meta: [
      { title: "Talk with Zaid or Zara — Islamic Voice Teachers for Quran, Tajweed, Arabic & Fiqh | Alaq" },
      {
        name: "description",
        content: "Talk with Zaid or Zara, polite voice teachers for Quran, Tajweed, Arabic, hadith, duas, fiqh and masail, controlling the nafs, using AI for Islam and starting Islamic content.",
      },
      { property: "og:title", content: "Zaid & Zara — Islamic Voice Teachers | Alaq" },
      { property: "og:description", content: "Learn Quran, Tajweed, Arabic, hadith, duas and fiqh by talking with Zaid or Zara in English, Hindi, Urdu, Telugu, Marathi or Hyderabadi Roman Urdu." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: ZaidPage,
});

function ZaidPage() {
  const { ready, user, displayName } = useAuth();
  const { voice, topic, setTopic, captions, references, idle, live, begin, statusText, teacher } = useZaid();
  const t = teacher.name;
  const captionsEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captionsEnd.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [captions]);

  const current = getZaidTopic(topic);
  const name = firstName(displayName);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">

      <section className="bg-hero relative overflow-hidden rounded-[2rem] px-6 py-10 text-night-foreground shadow-elegant md:px-12">
        <div className="girih pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Your voice teacher</p>
            <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
              Talk with <span className="text-gold-gradient">{t}</span>
            </h1>
            <p className="mt-3 max-w-lg opacity-85">
              Speak in English, Hindi, Urdu, Telugu, Marathi or Hyderabadi Roman Urdu. {t} replies gently in your language, teaches with
              verified ayahs, authentic hadith and Hisnul Muslim duas — and always names the source.
            </p>
            <p className="mt-4 text-sm opacity-75">
              Topic: <span className="font-semibold text-gold">{current.title}</span> · {current.blurb}
            </p>
            <div className="mt-5 max-w-sm rounded-2xl bg-card p-2 text-foreground">
              <TeacherPicker disabled={!idle} compact />
            </div>
            <Link to="/learn" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">
              Prefer step-by-step lessons? Tajweed, Arabic & Fiqh <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative grid size-44 place-items-center">
              {live && <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-gold/60" />}
              <div className={cn("absolute inset-3 rounded-full bg-gold/20 blur-2xl", live ? "animate-glow" : "opacity-40")} />
              <TeacherBadge teacher={teacher} className="relative size-36" />
            </div>
            <p role="status" className="h-5 text-sm opacity-85">
              {statusText}
            </p>

            {!ready ? (
              <Loader2 className="size-6 animate-spin opacity-70" />
            ) : !user ? (
              <Link
                to="/auth"
                search={{ redirect: "/zaid" }}
                className="bg-gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-7 font-semibold text-gold-foreground shadow-glow"
              >
                <LogIn className="size-4" /> Sign in to talk with {t}
              </Link>
            ) : idle ? (
              <button
                type="button"
                onClick={() => begin()}
                className="bg-gold-gradient inline-flex h-12 items-center gap-2 rounded-full px-7 font-semibold text-gold-foreground shadow-glow transition-transform active:scale-95"
              >
                <Mic className="size-4" /> {voice.hasConnected ? "Start a new lesson" : `Start lesson${name ? `, ${name}` : ""}`}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!live}
                  onClick={() => voice.setMuted(!voice.muted)}
                  aria-label={voice.muted ? "Unmute microphone" : "Mute microphone"}
                  className="grid size-12 place-items-center rounded-full border border-night-foreground/25 hover:bg-night-foreground/10 disabled:opacity-50"
                >
                  {voice.muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>
                <button
                  type="button"
                  disabled={voice.status === "stopping"}
                  onClick={voice.stop}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-destructive px-6 font-semibold text-destructive-foreground disabled:opacity-60"
                >
                  <PhoneOff className="size-4" /> End lesson
                </button>
              </div>
            )}
            {voice.playbackBlocked && (
              <button type="button" onClick={voice.resumePlayback} className="inline-flex items-center gap-2 text-sm text-gold underline">
                <Volume2 className="size-4" /> Tap to hear {t}
              </button>
            )}
            {voice.error && (
              <p role="alert" className="max-w-xs text-center text-sm text-gold">
                {voice.error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 font-display text-2xl font-semibold">Choose a topic</h2>
        <p className="mb-4 text-sm text-muted-foreground">Pick a subject before you start — you can always ask about anything else.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {ZAID_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!idle}
              aria-pressed={topic === t.id}
              onClick={() => setTopic(t.id)}
              className={cn(
                "relative overflow-hidden rounded-3xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                topic === t.id ? "border-gold bg-gold/10 shadow-glow" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant",
              )}
            >
              <p className="quran-text text-right text-xl leading-none text-gold/90">{t.arabic}</p>
              <p className="mt-3 font-display font-semibold leading-tight">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Sparkles className="size-4 text-gold" /> Live captions
          </h2>
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
            {captions.length === 0 ? (
              <p className="text-sm text-muted-foreground">What you and {t} say will appear here during the lesson.</p>
            ) : (
              captions.map((c, i) => (
                <div key={i} className={cn("flex", c.role === "user" ? "justify-end" : "justify-start")}>
                  <p
                    dir="auto"
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                      c.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {c.text}
                  </p>
                </div>
              ))
            )}
            <div ref={captionsEnd} />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <BookOpen className="size-4 text-gold" /> Sources {t} used
          </h2>
          {references.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Every ayah, hadith and dua {t} quotes is shown here with its reference.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {references.map((r, i) => (
                <li key={i} className="rounded-2xl border border-border p-4">
                  <ReferenceCard r={r} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {t} is an AI teacher. For personal rulings (fatwa), please ask a qualified scholar you trust.
      </p>
    </div>
  );
}

function ReferenceCard({ r }: { r: ZaidReference }) {
  if (r.kind === "quran") {
    return (
      <>
        <Link to="/quran/$surah" params={{ surah: String(r.surah) }} search={{ ayah: r.from }} className="text-sm font-semibold text-primary">
          {r.surahName} {r.surah}:{r.from}
          {r.to !== r.from ? `–${r.to}` : ""}
        </Link>
        {r.verses.slice(0, 2).map((v) => (
          <div key={v.ayah} className="mt-2">
            <p className="quran-text text-right text-xl">{v.arabic}</p>
            <p className="text-sm text-muted-foreground">{v.en}</p>
          </div>
        ))}
      </>
    );
  }
  if (r.kind === "hadith") {
    return (
      <>
        <p className="text-sm font-semibold text-primary">
          {r.collection} · no. {r.number}
        </p>
        <p className="mt-1 line-clamp-5 text-sm text-muted-foreground">{r.english}</p>
        {r.grades.length > 0 && <p className="mt-1 text-xs text-gold">{r.grades.join(" · ")}</p>}
      </>
    );
  }
  if (r.kind === "dua") {
    return (
      <>
        <p className="text-sm font-semibold text-primary">{r.title}</p>
        <p className="quran-text mt-1 text-right text-xl">{r.arabic}</p>
        <p className="text-sm text-muted-foreground">{r.translation}</p>
      </>
    );
  }
  return (
    <>
      <p className="text-sm font-semibold text-primary">Tajweed: {r.title}</p>
      <p className="text-xs text-muted-foreground">{r.source}</p>
    </>
  );
}
