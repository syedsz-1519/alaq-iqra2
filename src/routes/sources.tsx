import { shareImage } from "@/lib/share";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/alaq/app-shell";

export const Route = createFileRoute("/sources")({
  head: ({ match }) => ({
    meta: [
      { title: "Sources & Attribution | Alaq" },
      { name: "description", content: "Where Alaq's Quran text, translations, recitations, hadith and duas come from." },
      { property: "og:title", content: "Sources & Attribution | Alaq" },
      { property: "og:description", content: "Every text and recitation in Alaq comes from established, openly available sources." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: Sources,
});

const SOURCES = [
  {
    title: "Quran — Arabic text",
    items: [
      ["Uthmani script by the Tanzil Project, verified Quran text", "https://tanzil.net"],
      ["Delivered by the AlQuran.cloud API (Islamic Network)", "https://alquran.cloud"],
    ],
  },
  {
    title: "Quran — Translations",
    items: [
      ["English: Saheeh International", "https://alquran.cloud/translations"],
      ["Urdu: Maulana Fateh Muhammad Jalandhry", "https://alquran.cloud/translations"],
      ["Roman Urdu (Maududi), Telugu (King Fahd Complex) and Marathi (Muhammad Shafi'i Ansari) from the open Quran API", "https://github.com/fawazahmed0/quran-api"],
      ["Cross-check any ayah on Quran.com", "https://quran.com"],
    ],
  },
  {
    title: "Quran — Spoken translations",
    items: [
      ["English narration by Ibrahim Walk (Saheeh International) and Urdu narration by Shamshad Ali Khan, from EveryAyah.com", "https://everyayah.com"],
      ["Telugu and Marathi are read aloud by an AI voice, word for word from the published translations above", "https://github.com/fawazahmed0/quran-api"],
    ],
  },
  {
    title: "99 Names of Allah & Hadith of the day",
    items: [
      ["Asma ul Husna — Arabic, transliteration and meaning — from the AlAdhan API", "https://aladhan.com/asma-al-husna-api"],
      ["Hadith of the day is taken in order from An-Nawawi's Forty Hadith", "https://github.com/fawazahmed0/hadith-api"],
    ],
  },
  {
    title: "Quran — Recitations",
    items: [["Ayah-by-ayah recordings from EveryAyah.com (Al-Husary, Abdul Basit, Al-Minshawi, As-Sudais, Ash-Shuraym, Yasser Ad-Dossari and others)", "https://everyayah.com"]],
  },
  {
    title: "Hadith",
    items: [
      ["Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at-Tirmidhi, Sunan an-Nasa'i, Sunan Ibn Majah, Muwatta Malik, An-Nawawi's Forty and Forty Hadith Qudsi — Arabic and English, with scholars' grades", "https://github.com/fawazahmed0/hadith-api"],
      ["Numbering follows the widely used sunnah.com references", "https://sunnah.com"],
    ],
  },
  {
    title: "Duas & Adhkar",
    items: [["Hisn al-Muslim (Fortress of the Muslim) by Sa'id ibn Ali ibn Wahf al-Qahtani — text, transliteration, translation and audio", "https://www.hisnmuslim.com"]],
  },
] as const;

function Sources() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <PageHeader eyebrow="Transparency" title="Sources & attribution">
        Alaq does not write or alter religious text. Everything comes from the established sources below. Translations
        convey meaning only; for rulings, consult a qualified scholar.
      </PageHeader>
      <div className="space-y-4">
        {SOURCES.map((s) => (
          <section key={s.title} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">{s.title}</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {s.items.map(([text, href]) => (
                <li key={text}>
                  {text} —{" "}
                  <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                    {new URL(href).hostname.replace("www.", "")}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
