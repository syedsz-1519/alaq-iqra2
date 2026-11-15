import { queryOptions } from "@tanstack/react-query";
import { cachedJson } from "./offline-cache";

/** Day number in the local calendar, so "today's" picks change at local midnight. */
export function dayIndex(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

const HADITH_BASES = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
];

/** An-Nawawi's Forty (42 hadith): authentic, foundational sayings of the Prophet ﷺ. */
export const NAWAWI_TOTAL = 42;
export const dailyHadithNumber = (date: Date) => (dayIndex(date) % NAWAWI_TOTAL) + 1;

type HadithFile = { hadiths: { hadithnumber: number; text: string; grades?: { name: string; grade: string }[] }[] };

async function fetchEdition(edition: string, n: number) {
  let last: unknown;
  for (const base of HADITH_BASES) {
    try {
      return await cachedJson<HadithFile>(`${base}/${edition}/${n}.min.json`);
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error("Hadith unavailable");
}

export const dailyHadithQuery = (n: number) =>
  queryOptions({
    queryKey: ["daily-hadith", n],
    staleTime: Infinity,
    queryFn: async () => {
      const [en, ar] = await Promise.all([fetchEdition("eng-nawawi", n), fetchEdition("ara-nawawi", n).catch(() => null)]);
      const h = en.hadiths[0];
      if (!h?.text) throw new Error("Hadith unavailable");
      return {
        number: n,
        english: h.text.trim(),
        arabic: ar?.hadiths[0]?.text?.trim(),
        source: `An-Nawawi's Forty Hadith, no. ${n}`,
      };
    },
  });

export type DivineName = { number: number; arabic: string; transliteration: string; meaning: string };

export const NAMES_URL = "https://api.aladhan.com/v1/asmaAlHusna";

export const namesQuery = () =>
  queryOptions({
    queryKey: ["asma-ul-husna"],
    staleTime: Infinity,
    queryFn: async (): Promise<DivineName[]> => {
      const json = await cachedJson<{
        code: number;
        data: { name: string; transliteration: string; number: number; en: { meaning: string } }[];
      }>(NAMES_URL);
      if (json.code !== 200 || json.data.length !== 99) throw new Error("Names unavailable");
      return json.data.map((d) => ({ number: d.number, arabic: d.name, transliteration: d.transliteration, meaning: d.en.meaning }));
    },
  });

export const dailyNameNumber = (date: Date) => ((dayIndex(date) * 7) % 99) + 1;
