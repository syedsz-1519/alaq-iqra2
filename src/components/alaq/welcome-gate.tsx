import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, LogIn } from "lucide-react";
import { firstName, useAuth } from "@/lib/auth";
import { DailyHadith } from "./daily-hadith";

const SEEN_KEY = "alaq:welcome-seen";
const todayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const HIDDEN_ON = ["/auth", "/reset-password"];

/** A calm greeting before entering the app, shown once a day. */
export function WelcomeGate() {
  const { ready, user, displayName } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [date, setDate] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDate(now);
    try {
      if (localStorage.getItem(SEEN_KEY) !== todayKey(now)) setOpen(true);
    } catch {
      /* storage unavailable: skip the greeting */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !date || HIDDEN_ON.includes(pathname)) return null;

  const enter = () => {
    try {
      localStorage.setItem(SEEN_KEY, todayKey(date));
    } catch {
      /* ignore */
    }
    setLeaving(true);
    setTimeout(() => setOpen(false), 350);
  };

  const hijri = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(date);
  const name = firstName(displayName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Alaq"
      className={`bg-hero fixed inset-0 z-[60] overflow-y-auto text-night-foreground transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="girih pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
        <div className="relative">
          <div className="animate-glow absolute inset-0 rounded-full bg-gold/25 blur-3xl" />
          <img src="/icon-512.png" alt="Alaq" width={176} height={176} className="relative size-36 rounded-full object-cover shadow-glow md:size-44" />
        </div>
        <p className="quran-text animate-fade-up mt-6 text-2xl text-gold">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        <p className="animate-fade-up mt-4 text-xs font-semibold uppercase tracking-[0.25em] opacity-70" style={{ animationDelay: "80ms" }}>
          {hijri}
        </p>
        <h1 className="animate-fade-up mt-2 font-display text-4xl font-semibold leading-tight md:text-5xl" style={{ animationDelay: "140ms" }}>
          Assalamu alaikum
          {ready && name ? (
            <>
              ,<br />
              <span className="text-gold-gradient">{name}</span>
            </>
          ) : null}
        </h1>
        <p className="quran-text animate-fade-up mt-1 text-xl opacity-80" style={{ animationDelay: "180ms" }}>
          ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ
        </p>

        <div className="animate-fade-up mt-7 w-full" style={{ animationDelay: "260ms" }}>
          <DailyHadith date={date} tone="night" clamp />
        </div>

        <div className="animate-fade-up mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center" style={{ animationDelay: "340ms" }}>
          <button
            type="button"
            onClick={enter}
            autoFocus
            className="bg-gold-gradient inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 font-semibold text-gold-foreground shadow-glow transition-transform active:scale-95"
          >
            Enter Alaq <ArrowRight className="size-4" />
          </button>
          {ready && !user && (
            <Link
              to="/auth"
              onClick={enter}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-night-foreground/25 px-7 font-medium hover:bg-night-foreground/10"
            >
              <LogIn className="size-4" /> Sign in to be greeted by name
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
