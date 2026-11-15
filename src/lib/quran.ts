import { queryOptions } from "@tanstack/react-query";
import { cachedJson } from "./offline-cache";

const API = "https://api.alquran.cloud/v1";

export type SurahMeta = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  juz: number;
  page: number;
  sajda: boolean | object;
  text: string;
};

export type VerseRow = {
  number: number;
  numberInSurah: number;
  juz: number;
  page: number;
  sajda: boolean;
  arabic: string;
  en: string;
  ur: string;
};

export type SurahData = { meta: SurahMeta; bismillah: boolean; verses: VerseRow[] };

/** Recitations are served by EveryAyah.com, ayah by ayah. */
export const RECITER_GROUPS = [
  "Imams of Makkah & Madinah",
  "Classic Egyptian masters",
  "Renowned reciters",
  "Learning (with repetition)",
] as const;

export const RECITERS = [
  // Imams of the Two Holy Mosques (past and present)
  { id: "sudais", name: "Abdurrahman As-Sudais", folder: "Abdurrahmaan_As-Sudais_192kbps", group: 0 },
  { id: "shuraym", name: "Saud Ash-Shuraym", folder: "Saood_ash-Shuraym_128kbps", group: 0 },
  { id: "maher", name: "Maher Al-Muaiqly", folder: "MaherAlMuaiqly128kbps", group: 0 },
  { id: "dossari", name: "Yasser Ad-Dossari", folder: "Yasser_Ad-Dussary_128kbps", group: 0 },
  { id: "juhany", name: "Abdullah Awad Al-Juhany", folder: "Abdullaah_3awwaad_Al-Juhaynee_128kbps", group: 0 },
  { id: "budair", name: "Salah Al-Budair", folder: "Salah_Al_Budair_128kbps", group: 0 },
  { id: "muhsin-qasim", name: "Abdul Muhsin Al-Qasim", folder: "Muhsin_Al_Qasim_192kbps", group: 0 },
  { id: "hudhaify", name: "Ali Al-Hudhaify", folder: "Hudhaify_128kbps", group: 0 },
  { id: "ali-jaber", name: "Ali Jaber", folder: "Ali_Jaber_64kbps", group: 0 },
  { id: "ayyub", name: "Muhammad Ayyub", folder: "Muhammad_Ayyoub_128kbps", group: 0 },
  { id: "khalid-qahtani", name: "Khalid Al-Qahtani", folder: "Khaalid_Abdullaah_al-Qahtaanee_192kbps", group: 0 },
  // Classic Egyptian masters
  { id: "abdulbasit", name: "Abdul Basit (Murattal)", folder: "Abdul_Basit_Murattal_192kbps", group: 1 },
  { id: "abdulbasit-mujawwad", name: "Abdul Basit (Mujawwad)", folder: "Abdul_Basit_Mujawwad_128kbps", group: 1 },
  { id: "husary", name: "Mahmoud Khalil Al-Husary", folder: "Husary_128kbps", group: 1 },
  { id: "husary-mujawwad", name: "Al-Husary (Mujawwad)", folder: "Husary_128kbps_Mujawwad", group: 1 },
  { id: "minshawi", name: "Mohamed Siddiq Al-Minshawi", folder: "Minshawy_Murattal_128kbps", group: 1 },
  { id: "minshawi-mujawwad", name: "Al-Minshawi (Mujawwad)", folder: "Minshawy_Mujawwad_192kbps", group: 1 },
  { id: "mustafa-ismail", name: "Mustafa Ismail", folder: "Mustafa_Ismail_48kbps", group: 1 },
  { id: "tablawi", name: "Mohammad At-Tablawi", folder: "Mohammad_al_Tablaway_128kbps", group: 1 },
  { id: "jibreel", name: "Muhammad Jibreel", folder: "Muhammad_Jibreel_128kbps", group: 1 },
  // Renowned reciters
  { id: "ghamdi", name: "Saad Al-Ghamdi", folder: "Ghamadi_40kbps", group: 2 },
  { id: "ajamy", name: "Ahmed Al-Ajmi", folder: "ahmed_ibn_ali_al_ajamy_128kbps", group: 2 },
  { id: "shaatree", name: "Abu Bakr Ash-Shatri", folder: "Abu_Bakr_Ash-Shaatree_128kbps", group: 2 },
  { id: "basfar", name: "Abdullah Basfar", folder: "Abdullah_Basfar_192kbps", group: 2 },
  { id: "rifai", name: "Hani Ar-Rifai", folder: "Hani_Rifai_192kbps", group: 2 },
  { id: "bukhatir", name: "Salah Bukhatir", folder: "Salaah_AbdulRahman_Bukhatir_128kbps", group: 2 },
  { id: "matroud", name: "Abdullah Al-Matroud", folder: "Abdullah_Matroud_128kbps", group: 2 },
  { id: "qatami", name: "Nasser Al-Qatami", folder: "Nasser_Alqatami_128kbps", group: 2 },
  { id: "fares-abbad", name: "Fares Abbad", folder: "Fares_Abbad_64kbps", group: 2 },
  { id: "abdulkareem", name: "Muhammad Abdul Kareem", folder: "Muhammad_AbdulKareem_128kbps", group: 2 },
  { id: "alaqimy", name: "Akram Al-Alaqimy", folder: "Akram_AlAlaqimy_128kbps", group: 2 },
  { id: "yaser-salamah", name: "Yaser Salamah", folder: "Yaser_Salamah_128kbps", group: 2 },
  { id: "sahl-yassin", name: "Sahl Yassin", folder: "Sahl_Yassin_128kbps", group: 2 },
  { id: "ali-hajjaj", name: "Ali Hajjaj As-Suesy", folder: "Ali_Hajjaj_AlSuesy_128kbps", group: 2 },
  { id: "ayman-sowaid", name: "Ayman Suwayd", folder: "Ayman_Sowaid_64kbps", group: 2 },
  { id: "tunaiji", name: "Khalifa At-Tunaiji", folder: "khalefa_al_tunaiji_64kbps", group: 2 },
  { id: "aziz-alili", name: "Aziz Alili", folder: "aziz_alili_128kbps", group: 2 },
  { id: "abdulsamad", name: "Abdul Samad", folder: "AbdulSamad_64kbps_QuranExplorer.Com", group: 2 },
  { id: "ahmed-neana", name: "Ahmed Neana", folder: "Ahmed_Neana_128kbps", group: 1 },
  { id: "banna", name: "Mahmoud Ali Al-Banna", folder: "mahmoud_ali_al_banna_32kbps", group: 1 },
  { id: "akhdar", name: "Ibrahim Al-Akhdar", folder: "Ibrahim_Akhdar_32kbps", group: 0 },
  { id: "parhizgar", name: "Shahriar Parhizgar", folder: "Parhizgar_48kbps", group: 2 },
  { id: "karim-mansoori", name: "Karim Mansoori", folder: "Karim_Mansoori_40kbps", group: 2 },
  // Teaching recitations
  { id: "husary-muallim", name: "Al-Husary (Teaching)", folder: "Husary_Muallim_128kbps", group: 3 },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

/** The reciter new listeners hear first. */
export const DEFAULT_RECITER = "husary";
/** Unknown or removed reciters (e.g. an old saved choice) fall back to the default reciter. */
export const getReciter = (id: string) =>
  RECITERS.find((r) => r.id === id) ?? RECITERS.find((r) => r.id === DEFAULT_RECITER) ?? RECITERS[0];
export const reciterName = (id: string) => getReciter(id).name;

const pad3 = (n: number) => String(n).padStart(3, "0");
export const audioUrl = (reciter: string, surah: number, ayah: number) =>
  `https://everyayah.com/data/${getReciter(reciter).folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
export const surahAudioUrls = (reciter: string, surah: number, count: number) =>
  Array.from({ length: count }, (_, i) => audioUrl(reciter, surah, i + 1));

export const TRANSLATIONS = {
  en: { edition: "en.sahih", label: "English", name: "Saheeh International" },
  ur: { edition: "ur.jalandhry", label: "Urdu", name: "Fateh Muhammad Jalandhry" },
} as const;

export type LangId = "en" | "ur" | "roman" | "te" | "mr";

/** Text translations. en/ur come with the surah; the others load from the open Quran API. */
export const LANGS: Record<
  LangId,
  { label: string; native: string; translator: string; dir: "ltr" | "rtl"; edition?: string }
> = {
  en: { label: "English", native: "English", translator: "Saheeh International", dir: "ltr" },
  ur: { label: "Urdu", native: "اردو", translator: "Maulana Fateh Muhammad Jalandhry", dir: "rtl" },
  roman: { label: "Roman Urdu", native: "Roman Urdu", translator: "Abul A'la Maududi", dir: "ltr", edition: "urd-abulaalamaududi-la" },
  te: { label: "Telugu", native: "తెలుగు", translator: "Abdul Raheem Mohammad Moulana (King Fahd Complex)", dir: "ltr", edition: "tel-abdulraheemmoha" },
  mr: { label: "Marathi", native: "मराठी", translator: "Muhammad Shafi'i Ansari", dir: "ltr", edition: "mar-muhammadshafiia" },
};
export const LANG_IDS = Object.keys(LANGS) as LangId[];

export type VoiceLang = "none" | LangId;

/** Spoken translations: human narrators where they exist, an AI voice otherwise. */
export const VOICE_LANGS: Record<LangId, { narrator: string; ai: boolean }> = {
  en: { narrator: "Ibrahim Walk (Saheeh International)", ai: false },
  ur: { narrator: "Shamshad Ali Khan (Urdu)", ai: false },
  roman: { narrator: "Shamshad Ali Khan (Urdu)", ai: false },
  te: { narrator: "AI voice reading the Telugu translation", ai: true },
  mr: { narrator: "AI voice reading the Marathi translation", ai: true },
};

const pad3x = (n: number) => String(n).padStart(3, "0");
export function translationAudioUrl(lang: LangId, surah: number, ayah: number) {
  const key = `${pad3x(surah)}${pad3x(ayah)}`;
  if (lang === "en") return `https://everyayah.com/data/English/Sahih_Intnl_Ibrahim_Walk_192kbps/${key}.mp3`;
  if (lang === "ur" || lang === "roman")
    return `https://everyayah.com/data/translations/urdu_shamshad_ali_khan_46kbps/${key}.mp3`;
  // AI-voiced languages are stored on the device under this address once generated.
  return `https://alaq.app/voice/${lang}/${key}.wav`;
}

const FAWAZ = [
  "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions",
  "https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions",
];
export const extraTranslationUrls = (lang: LangId, surah: number) =>
  LANGS[lang].edition ? FAWAZ.map((b) => `${b}/${LANGS[lang].edition}/${surah}.json`) : [];

/** Removes verse numbering some editions prefix to each line (e.g. "१. "). */
export const cleanTranslation = (t: string) => t.replace(/^\s*[\d\u0966-\u096F\u0C66-\u0C6F]+\.\s*/, "").trim();

export const extraTranslationQuery = (lang: LangId, surah: number) =>
  queryOptions({
    queryKey: ["quran", "translation", lang, surah],
    staleTime: Infinity,
    enabled: Boolean(LANGS[lang].edition),
    queryFn: async () => {
      let lastError: unknown;
      for (const url of extraTranslationUrls(lang, surah)) {
        try {
          const data = await cachedJson<{ chapter: { verse: number; text: string }[] }>(url);
          return data.chapter.map((v) => cleanTranslation(v.text));
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Translation unavailable");
    },
  });

export const TOTAL_AYAHS = 6236;

export const surahTextUrl = (surah: number) =>
  `${API}/surah/${surah}/editions/quran-uthmani,en.sahih,ur.jalandhry`;
export const SURAH_LIST_URL = `${API}/surah`;

async function getJson<T>(url: string): Promise<T> {
  const json = await cachedJson<{ code: number; data: T }>(url);
  if (json.code !== 200) throw new Error("The Quran service returned an error");
  return json.data;
}

export const surahListQuery = () =>
  queryOptions({
    queryKey: ["quran", "surahs"],
    queryFn: () => getJson<SurahMeta[]>(SURAH_LIST_URL),
    staleTime: Infinity,
  });

/** Remove the leading Basmalah from ayah 1 (it is shown as a header instead). */
export function splitBismillah(surah: number, text: string) {
  if (surah === 1 || surah === 9) return { bismillah: false, text };
  const words = text.split(" ");
  if (words[0] === "بِسْمِ" && words.length > 4) {
    return { bismillah: true, text: words.slice(4).join(" ") };
  }
  return { bismillah: false, text };
}

type EditionPayload = SurahMeta & { ayahs: Ayah[] };

export const surahQuery = (surah: number) =>
  queryOptions({
    queryKey: ["quran", "surah", surah],
    staleTime: Infinity,
    queryFn: async (): Promise<SurahData> => {
      const eds = await getJson<EditionPayload[]>(surahTextUrl(surah));
      const [ar, en, ur] = eds;
      if (!ar || !en || !ur) throw new Error("Incomplete surah data");
      const { ayahs: _a, ...meta } = ar;
      let bismillah = false;
      const verses = ar.ayahs.map((a, i) => {
        let arabic = a.text;
        if (i === 0) {
          const s = splitBismillah(surah, a.text);
          bismillah = s.bismillah;
          arabic = s.text;
        }
        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          juz: a.juz,
          page: a.page,
          sajda: Boolean(a.sajda),
          arabic,
          en: en.ayahs[i]?.text ?? "",
          ur: ur.ayahs[i]?.text ?? "",
        };
      });
      return { meta, bismillah: bismillah || (surah !== 1 && surah !== 9), verses };
    },
  });

/** A stable "verse of the day" based on the calendar date. */
export function dailyAyahNumber(date: Date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  return ((day * 97 + date.getFullYear() * 13) % TOTAL_AYAHS) + 1;
}

export const ayahOfDayQuery = (n: number) =>
  queryOptions({
    queryKey: ["quran", "ayah", n],
    staleTime: Infinity,
    queryFn: async () => {
      const eds = await getJson<(Ayah & { surah: SurahMeta })[]>(
        `${API}/ayah/${n}/editions/quran-uthmani,${TRANSLATIONS.en.edition}`,
      );
      const [ar, en] = eds;
      if (!ar || !en) throw new Error("Incomplete ayah data");
      return {
        surah: ar.surah,
        numberInSurah: ar.numberInSurah,
        arabic: splitBismillah(ar.surah.number, ar.text).text,
        en: en.text,
      };
    },
  });

export type Settings = {
  reciter: string;
  /** Legacy single choice, kept so older saved settings still load. */
  translation?: "en" | "ur" | "both" | "none";
  translations?: LangId[];
  voiceTranslation?: VoiceLang;
  /** Reciter chosen for a particular surah (surah number → reciter id); falls back to `reciter`. */
  surahReciters?: Record<string, string>;
  /** "arabic" = Mushaf-style Arabic only; "translated" = each ayah with the chosen translations. */
  view?: ReadingView;
  arabicSize: number;
};

export type ReadingView = "arabic" | "translated";

export const DEFAULT_SETTINGS: Settings = {
  reciter: DEFAULT_RECITER,
  translations: ["en"],
  voiceTranslation: "none",
  view: "translated",
  arabicSize: 32,
};

/** Fills in defaults and upgrades the older single-translation setting. */
export function normalizeSettings(raw: Partial<Settings> | null | undefined): Required<Omit<Settings, "translation">> {
  const r = raw ?? {};
  let translations = r.translations;
  if (!translations) {
    translations =
      r.translation === "ur" ? ["ur"] : r.translation === "both" ? ["en", "ur"] : r.translation === "none" ? [] : ["en"];
  }
  return {
    reciter: getReciter(r.reciter ?? DEFAULT_SETTINGS.reciter).id,
    translations: translations.filter((t): t is LangId => t in LANGS),
    voiceTranslation: r.voiceTranslation && (r.voiceTranslation === "none" || r.voiceTranslation in LANGS) ? r.voiceTranslation : "none",
    view: r.view === "arabic" ? "arabic" : "translated",
    surahReciters: r.surahReciters ?? {},
    arabicSize: r.arabicSize ?? DEFAULT_SETTINGS.arabicSize,
  };
}

/** The reciter that plays a surah: its own choice if set, otherwise the default reciter. */
export function reciterForSurah(settings: Partial<Settings> | null | undefined, surah: number) {
  const own = settings?.surahReciters?.[String(surah)];
  return getReciter(own ?? settings?.reciter ?? DEFAULT_SETTINGS.reciter).id;
}

export function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}
