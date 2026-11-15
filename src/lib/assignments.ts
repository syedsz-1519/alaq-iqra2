import { TAJWEED_REVIEW } from "./tajweed-notes";

export type Assignment =
  | {
      id: string;
      kind: "quran";
      title: string;
      focus: string;
      topic?: string;
      level: "Beginner" | "Intermediate";
      surah: number;
      from: number;
      to: number;
      instructions: string;
    }
  | {
      id: string;
      kind: "dua";
      title: string;
      focus: string;
      level: "Beginner" | "Intermediate";
      category: number;
      item: number;
      instructions: string;
    }
  | {
      id: string;
      kind: "question";
      title: string;
      focus: string;
      level: "Beginner" | "Intermediate";
      question: string;
      answer: string;
      instructions: string;
    };

export const ASSIGNMENTS: Assignment[] = [
  { id: "fatihah", kind: "quran", title: "Recite Al-Fatihah", focus: "Madd 'Arid lis-Sukun & the lam of Allah", topic: "madd", level: "Beginner", surah: 1, from: 1, to: 7, instructions: "Recite the whole surah slowly. Stop at the end of each ayah and give the madd its length." },
  { id: "ikhlas", kind: "quran", title: "Recite Al-Ikhlas", focus: "Qalqalah on لَمْ يَلِدْ", topic: "qalqalah", level: "Beginner", surah: 112, from: 1, to: 4, instructions: "Recite all four ayahs. Let the dal bounce lightly when you stop — no added vowel." },
  { id: "falaq", kind: "quran", title: "Recite Al-Falaq", focus: "Qalqalah Kubra when stopping", topic: "qalqalah", level: "Beginner", surah: 113, from: 1, to: 5, instructions: "Stop at each ayah end and make the echo clear on the stopped letter." },
  { id: "masad", kind: "quran", title: "Recite Al-Masad", focus: "Qalqalah with shaddah & idgham", topic: "qalqalah", level: "Beginner", surah: 111, from: 1, to: 5, instructions: "Recite the whole surah. Notice the strong echo on وَتَبَّ." },
  { id: "kawthar", kind: "quran", title: "Recite Al-Kawthar", focus: "Madd Munfasil", topic: "madd", level: "Beginner", surah: 108, from: 1, to: 3, instructions: "Lengthen إِنَّا أَعْطَيْنَاكَ consistently, 4–5 counts." },
  { id: "nasr", kind: "quran", title: "Recite An-Nasr", focus: "Madd Muttasil & heavy lam of Allah", topic: "madd", level: "Beginner", surah: 110, from: 1, to: 3, instructions: "Give جَاءَ its connected madd and keep the lam in نَصْرُ اللَّهِ heavy." },
  { id: "fil", kind: "quran", title: "Recite Al-Fil", focus: "Ikhfa Shafawi (ayah 4)", topic: "meem-sakin", level: "Beginner", surah: 105, from: 1, to: 5, instructions: "In ayah 4, keep the lips lightly together on the meem before ب with ghunnah." },
  { id: "quraysh", kind: "quran", title: "Recite Quraysh", focus: "Idgham Shafawi (ayah 4)", topic: "meem-sakin", level: "Beginner", surah: 106, from: 1, to: 4, instructions: "Merge the two meems in أَطْعَمَهُم مِّن with a two-count ghunnah." },
  { id: "zalzalah", kind: "quran", title: "Recite Az-Zalzalah 7–8", focus: "Idgham with ghunnah (tanween)", topic: "idgham", level: "Beginner", surah: 99, from: 7, to: 8, instructions: "Merge the tanween in خَيْرًا يَرَهُ with ghunnah." },
  { id: "kursi", kind: "quran", title: "Recite Ayat al-Kursi", focus: "Fluency & memorisation", level: "Intermediate", surah: 2, from: 255, to: 255, instructions: "Recite Ayat al-Kursi from memory if you can." },
  { id: "mulk-1-5", kind: "quran", title: "Recite Al-Mulk 1–5", focus: "Ikhfa & madd in a longer passage", topic: "ikhfa-haqiqi", level: "Intermediate", surah: 67, from: 1, to: 5, instructions: "Recite the first five ayahs at a calm, steady pace." },
  { id: "dua-sleep", kind: "dua", title: "Dua before sleeping", focus: "Memorise a daily dua", level: "Beginner", category: 28, item: 105, instructions: "Recite the dua the Prophet ﷺ said before sleeping." },
  { id: "dua-wake", kind: "dua", title: "Dua on waking up", focus: "Memorise a daily dua", level: "Beginner", category: 1, item: 1, instructions: "Recite the dua for waking up." },
  { id: "dua-eating", kind: "dua", title: "Dua after eating", focus: "Memorise a daily dua", level: "Beginner", category: 70, item: 180, instructions: "Recite the dua after finishing a meal." },
  { id: "dua-worry", kind: "dua", title: "Dua in worry and grief", focus: "Memorise a protective dua", level: "Intermediate", category: 34, item: 121, instructions: "Recite the dua for anxiety and sorrow." },
  ...TAJWEED_REVIEW.map(
    (r, i): Assignment => ({
      id: `tajweed-q${i + 1}`,
      kind: "question",
      title: `Tajweed question ${i + 1}`,
      focus: r.q,
      level: "Beginner",
      question: r.q,
      answer: r.a,
      instructions: "Answer aloud in your own words — English, Urdu or any language you're comfortable with.",
    }),
  ),
];

export const getAssignment = (id: string) => ASSIGNMENTS.find((a) => a.id === id);

export type Attempt = {
  at: number;
  score: number;
  transcript: string;
  summary: string;
  tips: string[];
  missing: string[];
};

/** Strips harakat, tatweel, Quranic marks and punctuation, and unifies letter variants for comparing words. */
export function normalizeArabic(text: string) {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-level comparison of a recitation transcript with the expected text (longest common subsequence). */
export function compareRecitation(expected: string, heard: string) {
  const e = normalizeArabic(expected).split(" ").filter(Boolean);
  const h = normalizeArabic(heard).split(" ").filter(Boolean);
  const dp = Array.from({ length: e.length + 1 }, () => new Array<number>(h.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--)
    for (let j = h.length - 1; j >= 0; j--)
      dp[i]![j] = e[i] === h[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const missing: string[] = [];
  const extra: string[] = [];
  let i = 0;
  let j = 0;
  while (i < e.length && j < h.length) {
    if (e[i] === h[j]) {
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) missing.push(e[i++]!);
    else extra.push(h[j++]!);
  }
  while (i < e.length) missing.push(e[i++]!);
  while (j < h.length) extra.push(h[j++]!);
  const matched = dp[0]![0]!;
  const score = e.length ? Math.round((matched / e.length) * 100) : 0;
  return { score, matched, total: e.length, missing, extra };
}
