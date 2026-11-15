import { shareImage } from "@/lib/share";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Bookmark, HandHeart, Headphones, ScrollText, Sparkles, Star } from "lucide-react";
import { firstName, useAuth } from "@/lib/auth";
import { getTeacher } from "@/lib/teachers";
import { DailyHadith } from "@/components/alaq/daily-hadith";
import { ayahOfDayQuery, dailyAyahNumber } from "@/lib/quran";
import { useBookmarks } from "@/lib/reading";
import { ContinueReadingCard, ResumeListeningCard } from "@/components/alaq/continue-reading";
import { OfflineIndicator } from "@/components/alaq/offline-badges";
import { useAudioPlayer } from "@/components/alaq/audio-player";

export const Route = createFileRoute("/")({
  head: ({ match }) => ({
    meta: [
      { title: "Alaq — Read & Listen to the Quran, Hadith, Duas and Voice Lessons" },
      {
        name: "description",
        content: "Alaq is a free Islamic app: read and listen to all 114 surahs with translations in your language, learn Tajweed, Arabic and Fiqh with Zaid or Zara, explore authentic hadith, duas, dhikr and the 99 Names of Allah.",
      },
      { property: "og:title", content: "Alaq — Quran, Hadith, Duas & Voice Lessons" },
      { property: "og:description", content: "Read and listen to the Quran in Arabic with your language, learn with Zaid or Zara, and keep hadith, duas and the 99 Names close." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: Home,
});

const TILES = [
  { to: "/quran", title: "Read Quran", arabic: "اقرأ", text: "All 114 surahs with translation", icon: BookOpen },
  { to: "/listen", title: "Listen", arabic: "استمع", text: "Choose your reciter", icon: Headphones },
  { to: "/hadith", title: "Hadith", arabic: "الحديث", text: "Bukhari, Muslim & the Sunan", icon: ScrollText },
  { to: "/duas", title: "Duas", arabic: "الأدعية", text: "Hisnul Muslim for every moment", icon: HandHeart },
  { to: "/names", title: "99 Names", arabic: "الأسماء", text: "Asma ul Husna with meanings", icon: Star },
  { to: "/dhikr", title: "Dhikr", arabic: "الذكر", text: "Tasbih counter with daily goals", icon: Sparkles },
] as const;

function useClientDate() {
  const [d, setD] = useState<Date | null>(null);
  useEffect(() => setD(new Date()), []);
  return d;
}

function Home() {
  const date = useClientDate();
  const { user, displayName, teacher: teacherId } = useAuth();
  const teacher = getTeacher(teacherId);
  const hijri = date
    ? new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(date)
    : "";
  const name = firstName(displayName);
  const [bookmarks] = useBookmarks();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <OfflineIndicator className="mb-4 w-fit" />
      <section className="bg-hero relative overflow-hidden rounded-[2rem] px-6 py-10 text-night-foreground shadow-elegant md:px-12 md:py-14">
        <div className="girih pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{hijri || "\u00a0"}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-6xl">
              Assalamu alaikum{name ? "," : ""}
              {name && (
                <>
                  <br />
                  <span className="text-gold-gradient">{name}</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-md opacity-85">
              Read in the name of your Lord. The Holy Quran to read and to listen, authentic hadith, everyday duas — and{" "}
              {teacher.name}, your teacher, a voice away.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/quran"
                className="bg-gold-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-glow"
              >
                Read the Quran <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/listen"
                className="inline-flex items-center gap-2 rounded-full border border-night-foreground/25 px-5 py-2.5 text-sm font-medium hover:bg-night-foreground/10"
              >
                <Headphones className="size-4" /> Listen
              </Link>
              {!user && (
                <Link to="/auth" className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium opacity-85 hover:opacity-100">
                  Sign in
                </Link>
              )}
            </div>
          </div>
          <div className="relative mx-auto">
            <div className="animate-glow absolute inset-6 rounded-full bg-gold/25 blur-3xl" />
            <img src="/icon-512.png" alt="Alaq — Quran calligraphy" width={288} height={288} className="relative size-56 rounded-full object-cover shadow-glow md:size-72" />
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <ContinueReadingCard />
        <ResumeListeningCard />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-2xl font-semibold">Explore</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {TILES.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group bg-card-gradient relative overflow-hidden rounded-3xl border border-border p-5 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-elegant"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <t.icon className="size-5" />
              </span>
              <p className="quran-text absolute right-4 top-3 text-xl text-gold/80">{t.arabic}</p>
              <p className="mt-6 font-display text-lg font-semibold">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {date ? <DailyHadith date={date} /> : <div className="h-64 rounded-3xl border border-border bg-card" />}
        {date ? <AyahOfTheDay n={dailyAyahNumber(date)} /> : <div className="h-64 rounded-3xl border border-border bg-card" />}
      </div>

      <div className="mt-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Bookmarks</h2>
            <Link to="/quran" className="text-sm text-primary">
              See all
            </Link>
          </div>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <Bookmark className="mb-2 size-5" />
              Bookmark ayahs while you read and they'll appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.slice(0, 4).map((b) => (
                <li key={`${b.surah}:${b.ayah}`}>
                  <Link
                    to="/quran/$surah"
                    params={{ surah: String(b.surah) }}
                    search={{ ayah: b.ayah }}
                    className="block rounded-xl p-2 hover:bg-secondary"
                  >
                    <p className="text-sm font-semibold">
                      {b.englishName} <span className="text-gold">{b.surah}:{b.ayah}</span>
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{b.preview}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AyahOfTheDay({ n }: { n: number }) {
  const { data, isError } = useQuery(ayahOfDayQuery(n));
  const player = useAudioPlayer();
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-elegant">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Ayah of the day</p>
      {isError ? (
        <p className="mt-3 text-sm text-muted-foreground">Connect to the internet to see today's ayah.</p>
      ) : !data ? (
        <div className="mt-4 space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <>
          <p className="quran-text mt-4 text-right text-3xl leading-[2.5]">{data.arabic}</p>
          <p className="mt-3 leading-relaxed text-foreground/85">{data.en}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <Link
              to="/quran/$surah"
              params={{ surah: String(data.surah.number) }}
              search={{ ayah: data.numberInSurah }}
              className="font-medium text-primary"
            >
              {data.surah.englishName} {data.surah.number}:{data.numberInSurah}
            </Link>
            <button
              type="button"
              onClick={() => void player.playSurah(data.surah.number, data.numberInSurah)}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
            >
              Listen
            </button>
          </div>
        </>
      )}
    </section>
  );
}
