import { queryOptions } from "@tanstack/react-query";
import collections from "@/data/hadith-collections.json";
import { cachedJson } from "./offline-cache";

export type HadithSection = { n: number; name: string; first: number; last: number };
export type HadithCollection = {
  key: string;
  name: string;
  total: number;
  sections: HadithSection[];
};

type CollectionInfo = { arabic: string; compiler: string; blurb: string; tag: string };

const INFO: Record<string, CollectionInfo> = {
  bukhari: { arabic: "صحيح البخاري", compiler: "Imam Muhammad al-Bukhari (d. 256 AH)", blurb: "The most authentic collection after the Quran.", tag: "Sahih" },
  muslim: { arabic: "صحيح مسلم", compiler: "Imam Muslim ibn al-Hajjaj (d. 261 AH)", blurb: "Second of the two Sahih collections.", tag: "Sahih" },
  abudawud: { arabic: "سنن أبي داود", compiler: "Imam Abu Dawud (d. 275 AH)", blurb: "Focused on rulings of fiqh. Grades shown per hadith.", tag: "Sunan" },
  tirmidhi: { arabic: "جامع الترمذي", compiler: "Imam at-Tirmidhi (d. 279 AH)", blurb: "Includes the compiler's own grading notes.", tag: "Sunan" },
  nasai: { arabic: "سنن النسائي", compiler: "Imam an-Nasa'i (d. 303 AH)", blurb: "Known for strict narrator criteria.", tag: "Sunan" },
  ibnmajah: { arabic: "سنن ابن ماجه", compiler: "Imam Ibn Majah (d. 273 AH)", blurb: "The sixth of the six major books.", tag: "Sunan" },
  malik: { arabic: "موطأ مالك", compiler: "Imam Malik ibn Anas (d. 179 AH)", blurb: "The earliest surviving collection of hadith and fiqh.", tag: "Muwatta" },
  nawawi: { arabic: "الأربعون النووية", compiler: "Imam an-Nawawi (d. 676 AH)", blurb: "Forty-two foundational hadith of the religion.", tag: "Forty" },
  qudsi: { arabic: "الأحاديث القدسية", compiler: "Compiled collection", blurb: "Forty sayings the Prophet ﷺ narrated from Allah.", tag: "Qudsi" },
};

const FALLBACK_INFO: CollectionInfo = { arabic: "", compiler: "", blurb: "", tag: "Hadith" };
export const collectionInfo = (key: string): CollectionInfo => INFO[key] ?? FALLBACK_INFO;

export const COLLECTIONS = collections as HadithCollection[];

export const getCollection = (key: string) => COLLECTIONS.find((c) => c.key === key);

export type Hadith = {
  hadithnumber: number;
  arabicnumber: number | string;
  text: string;
  arabic?: string | undefined;
  grades: { name: string; grade: string }[];
  reference: { book: number; hadith: number };
};

type SectionFile = { metadata: { name: string }; hadiths: Hadith[] };

const SOURCES = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions",
];

async function fetchSection(edition: string, section: number): Promise<SectionFile> {
  let lastError: unknown;
  for (const base of SOURCES) {
    try {
      return await cachedJson<SectionFile>(`${base}/${edition}/sections/${section}.min.json`);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not load hadith");
}

export const hadithSectionQuery = (collection: string, section: number) =>
  queryOptions({
    queryKey: ["hadith", collection, section],
    staleTime: Infinity,
    queryFn: async () => {
      const [eng, ara] = await Promise.all([
        fetchSection(`eng-${collection}`, section),
        fetchSection(`ara-${collection}`, section).catch(() => null),
      ]);
      const arabicByNumber = new Map(ara?.hadiths.map((h) => [h.hadithnumber, h.text]) ?? []);
      return eng.hadiths
        .filter((h) => h.text?.trim())
        .map((h) => ({ ...h, arabic: arabicByNumber.get(h.hadithnumber) }));
    },
  });

/** Collections with a published Urdu edition in the Hadith API. */
export const HADITH_URDU_COLLECTIONS = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik"];
export type HadithLang = "en" | "ur" | "roman" | "te" | "mr";
export const HADITH_LANGS: { id: HadithLang; label: string; native: string; ai: boolean }[] = [
  { id: "en", label: "English", native: "English", ai: false },
  { id: "ur", label: "Urdu", native: "اردو", ai: false },
  { id: "roman", label: "Roman Urdu", native: "Roman Urdu", ai: true },
  { id: "te", label: "Telugu", native: "తెలుగు", ai: true },
  { id: "mr", label: "Marathi", native: "मराठी", ai: true },
];

/** Published Urdu text for one book, keyed by hadith number. */
export const hadithUrduQuery = (collection: string, section: number) =>
  queryOptions({
    queryKey: ["hadith-urdu", collection, section],
    staleTime: Infinity,
    queryFn: async () => {
      const f = await fetchSection(`urd-${collection}`, section);
      return Object.fromEntries(f.hadiths.filter((h) => h.text?.trim()).map((h) => [h.hadithnumber, h.text])) as Record<number, string>;
    },
  });
