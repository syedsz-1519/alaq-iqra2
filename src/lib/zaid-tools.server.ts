/**
 * Verified-source lookups for Zaid. Every Quran ayah, hadith and dua Zaid speaks or shows
 * comes from these tools, never from model memory.
 */
import duasData from "@/data/duas.json";
import { TAJWEED_SOURCE, TAJWEED_TOPICS, tajweedNotesText } from "./tajweed-notes";

export type ZaidReference =
  | { kind: "quran"; surah: number; surahName: string; from: number; to: number; verses: { ayah: number; arabic: string; en: string; ur: string }[]; source: string }
  | { kind: "hadith"; collection: string; number: number; arabic?: string; english: string; grades: string[]; source: string }
  | { kind: "dua"; title: string; arabic: string; transliteration: string; translation: string; repeat: number; category: number; source: string }
  | { kind: "tajweed"; topic: string; title: string; source: string };

type DuaItem = { id: number; arabic: string; transliteration: string; translation: string; repeat: number };
type DuaCat = { id: number; title: string; items: DuaItem[] };

export const HADITH_COLLECTIONS = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik", "nawawi", "qudsi"] as const;
const HADITH_NAMES: Record<string, string> = {
  bukhari: "Sahih al-Bukhari",
  muslim: "Sahih Muslim",
  abudawud: "Sunan Abu Dawud",
  tirmidhi: "Jami at-Tirmidhi",
  nasai: "Sunan an-Nasa'i",
  ibnmajah: "Sunan Ibn Majah",
  malik: "Muwatta Malik",
  nawawi: "An-Nawawi's Forty",
  qudsi: "Forty Hadith Qudsi",
};

export const ZAID_TOOLS = [
  {
    type: "function" as const,
    name: "get_quran_verses",
    description: "Fetch the verified Arabic text (Uthmani) with English and Urdu translation for up to 10 consecutive ayahs.",
    parameters: {
      type: "object",
      properties: {
        surah: { type: "integer", minimum: 1, maximum: 114 },
        from_ayah: { type: "integer", minimum: 1, maximum: 286 },
        to_ayah: { type: "integer", minimum: 1, maximum: 286 },
      },
      required: ["surah", "from_ayah", "to_ayah"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "get_hadith",
    description: "Fetch a hadith by collection and hadith number (sunnah.com numbering), with Arabic, English and grades.",
    parameters: {
      type: "object",
      properties: {
        collection: { type: "string", enum: [...HADITH_COLLECTIONS] },
        number: { type: "integer", minimum: 1, maximum: 8000 },
      },
      required: ["collection", "number"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "find_dua",
    description: "Search Hisnul Muslim for authentic duas by situation in English (e.g. 'sleeping', 'travel', 'anxiety', 'rain').",
    parameters: {
      type: "object",
      properties: { query: { type: "string", minLength: 2, maxLength: 80 } },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "search_quran",
    description: "Find ayahs about a topic by searching the Saheeh International English translation (one or two keywords, e.g. 'patience', 'parents'). Returns references; then fetch exact Arabic with get_quran_verses.",
    parameters: {
      type: "object",
      properties: { keyword: { type: "string", minLength: 2, maxLength: 40 } },
      required: ["keyword"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "get_quran_translation",
    description: "Fetch a published translation of up to 10 consecutive ayahs in Roman Urdu (Maududi), Telugu or Marathi.",
    parameters: {
      type: "object",
      properties: {
        lang: { type: "string", enum: ["roman", "te", "mr"] },
        surah: { type: "integer", minimum: 1, maximum: 114 },
        from_ayah: { type: "integer", minimum: 1, maximum: 286 },
        to_ayah: { type: "integer", minimum: 1, maximum: 286 },
      },
      required: ["lang", "surah", "from_ayah", "to_ayah"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "get_tajweed_notes",
    description: `Read the student's Tajweed syllabus (${TAJWEED_SOURCE}). Use 'all' for an overview.`,
    parameters: {
      type: "object",
      properties: { topic: { type: "string", enum: ["all", ...TAJWEED_TOPICS.map((t) => t.id)] } },
      required: ["topic"],
      additionalProperties: false,
    },
    strict: true,
  },
];

const int = (v: unknown, min: number, max: number) => {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) throw new Error("Invalid tool arguments");
  return v;
};

async function json<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Source request failed (${res.status})`);
  return (await res.json()) as T;
}

async function quranVerses(surah: number, from: number, to: number) {
  const start = Math.min(from, to);
  const count = Math.min(10, Math.abs(to - from) + 1);
  const data = await json<{ data: { englishName: string; ayahs: { numberInSurah: number; text: string }[] }[] }>(
    `https://api.alquran.cloud/v1/surah/${surah}/editions/quran-uthmani,en.sahih,ur.jalandhry?offset=${start - 1}&limit=${count}`,
  );
  const [ar, en, ur] = data.data;
  if (!ar || !en || !ur || ar.ayahs.length === 0) throw new Error("Those ayahs were not found");
  return {
    kind: "quran" as const,
    surah,
    surahName: ar.englishName,
    from: start,
    to: start + ar.ayahs.length - 1,
    verses: ar.ayahs.map((a, i) => ({ ayah: a.numberInSurah, arabic: a.text, en: en.ayahs[i]?.text ?? "", ur: ur.ayahs[i]?.text ?? "" })),
    source: "Tanzil Uthmani text via AlQuran.cloud; Saheeh International; Jalandhry",
  };
}

async function hadith(collection: string, number: number) {
  const bases = ["https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions", "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions"];
  type H = { hadiths: { hadithnumber: number; text: string; grades?: { name: string; grade: string }[] }[] };
  let eng: H | undefined;
  let ara: H | undefined;
  for (const b of bases) {
    try {
      [eng, ara] = await Promise.all([json<H>(`${b}/eng-${collection}/${number}.min.json`), json<H>(`${b}/ara-${collection}/${number}.min.json`).catch(() => undefined)]);
      break;
    } catch {
      /* try the next mirror */
    }
  }
  const h = eng?.hadiths[0];
  if (!h || !h.text.trim()) throw new Error("That hadith number was not found in this collection");
  return {
    kind: "hadith" as const,
    collection: HADITH_NAMES[collection] ?? collection,
    number,
    ...(ara?.hadiths[0]?.text ? { arabic: ara.hadiths[0].text } : {}),
    english: h.text,
    grades: (h.grades ?? []).map((g) => `${g.grade} (${g.name})`),
    source: "fawazahmed0/hadith-api, sunnah.com numbering",
  };
}

async function searchQuran(keyword: string) {
  const clean = keyword.replace(/[^\p{L}\s'-]/gu, "").trim();
  if (clean.length < 2) throw new Error("Keyword too short");
  type R = { data: { count: number; matches: { numberInSurah: number; text: string; surah: { number: number; englishName: string } }[] } };
  const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(clean)}/all/en.sahih`);
  if (res.status === 404) return { count: 0, matches: [] };
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const d = ((await res.json()) as R).data;
  return {
    count: d.count,
    matches: d.matches.slice(0, 8).map((m) => ({ surah: m.surah.number, surahName: m.surah.englishName, ayah: m.numberInSurah, english: m.text })),
    source: "Saheeh International via AlQuran.cloud",
  };
}

const TRANSLATION_EDITIONS = { roman: "urd-abulaalamaududi-la", te: "tel-abdulraheemmoha", mr: "mar-muhammadshafiia" } as const;

async function quranTranslation(lang: keyof typeof TRANSLATION_EDITIONS, surah: number, from: number, to: number) {
  const start = Math.min(from, to);
  const end = Math.min(Math.max(from, to), start + 9);
  const d = await json<{ chapter: { verse: number; text: string }[] }>(
    `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${TRANSLATION_EDITIONS[lang]}/${surah}.json`,
  );
  const verses = d.chapter.filter((v) => v.verse >= start && v.verse <= end).map((v) => ({ ayah: v.verse, text: v.text }));
  if (!verses.length) throw new Error("Those ayahs were not found");
  return { lang, surah, verses, source: `fawazahmed0/quran-api ${TRANSLATION_EDITIONS[lang]}` };
}

function findDua(query: string) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const cats = duasData as DuaCat[];
  const scored = cats
    .map((c) => {
      const hay = `${c.title} ${c.items.map((i) => i.translation).join(" ")}`.toLowerCase();
      const title = c.title.toLowerCase();
      const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  return scored.flatMap(({ c }) =>
    c.items.slice(0, 2).map((i) => ({
      kind: "dua" as const,
      title: c.title,
      arabic: i.arabic,
      transliteration: i.transliteration,
      translation: i.translation,
      repeat: i.repeat,
      category: c.id,
      source: "Hisn al-Muslim (Sa'id al-Qahtani)",
    })),
  );
}

/** Runs one tool call; returns the text for the model and any references to show the student. */
export async function runZaidTool(name: string, rawArgs: string): Promise<{ output: string; references: ZaidReference[] }> {
  const args = JSON.parse(rawArgs) as Record<string, unknown>;
  try {
    if (name === "get_quran_verses") {
      const surah = int(args["surah"], 1, 114);
      const r = await quranVerses(surah, int(args["from_ayah"], 1, 286), int(args["to_ayah"], 1, 286));
      return { output: JSON.stringify(r), references: [r] };
    }
    if (name === "get_hadith") {
      const c = String(args["collection"]);
      if (!(HADITH_COLLECTIONS as readonly string[]).includes(c)) throw new Error("Unknown collection");
      const r = await hadith(c, int(args["number"], 1, 8000));
      return { output: JSON.stringify(r), references: [r] };
    }
    if (name === "find_dua") {
      const q = String(args["query"] ?? "").slice(0, 80);
      const r = findDua(q);
      return { output: r.length ? JSON.stringify(r) : "No matching dua was found in Hisnul Muslim.", references: r };
    }
    if (name === "search_quran") {
      const r = await searchQuran(String(args["keyword"] ?? "").slice(0, 40));
      return { output: JSON.stringify(r), references: [] };
    }
    if (name === "get_quran_translation") {
      const lang = String(args["lang"]);
      if (!(lang in TRANSLATION_EDITIONS)) throw new Error("Unknown language");
      const r = await quranTranslation(lang as keyof typeof TRANSLATION_EDITIONS, int(args["surah"], 1, 114), int(args["from_ayah"], 1, 286), int(args["to_ayah"], 1, 286));
      return { output: JSON.stringify(r), references: [] };
    }
    if (name === "get_tajweed_notes") {
      const topic = String(args["topic"]);
      const t = TAJWEED_TOPICS.find((x) => x.id === topic);
      const text = tajweedNotesText(t ? topic : undefined);
      return {
        output: `${text}\n\nSource: ${TAJWEED_SOURCE}`,
        references: t ? [{ kind: "tajweed", topic: t.id, title: t.title, source: TAJWEED_SOURCE }] : [],
      };
    }
  } catch (e) {
    return { output: `Lookup failed: ${e instanceof Error ? e.message : "unknown error"}. Do not quote from memory.`, references: [] };
  }
  throw new Error("Unsupported backend tool");
}
