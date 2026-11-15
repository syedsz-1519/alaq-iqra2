/** Structured lessons the voice teacher gives. Client-safe: the relay validates lesson ids against this list. */
import { TAJWEED_TOPICS } from "./tajweed-notes";
import type { ZaidTopicId } from "./zaid-topics";

export type TrackId = "tajweed" | "arabic" | "fiqh";
/** A Quran reference to practise with "Repeat after your teacher" (text is always fetched, never typed here). */
export type Practice = { surah: number; ayah: number; note?: string };
export type Lesson = {
  id: string;
  track: TrackId;
  topic: ZaidTopicId;
  title: string;
  summary: string;
  /** What the teacher should cover, sent to the voice relay. */
  focus: string;
  practice: Practice[];
};

const ref = (r: string, note?: string): Practice => {
  const [s, a] = r.split(":").map(Number);
  return { surah: s ?? 1, ayah: a ?? 1, ...(note ? { note } : {}) };
};

const tajweed: Lesson[] = TAJWEED_TOPICS.map((t) => ({
  id: `tajweed-${t.id}`,
  track: "tajweed",
  topic: "tajweed",
  title: t.title,
  summary: t.remember,
  focus: `the Tajweed rule "${t.title}" (${t.chapter}) from the student's Little Tajweed Guide notes: explain it simply, recite one example ayah from the notes, then ask the student to recite it back and gently correct them`,
  practice: t.examples.slice(0, 3).map((e) => ref(e.ref, e.note)),
}));

const arabic: Lesson[] = [
  { id: "arabic-letters", title: "The Arabic letters", summary: "All 28 letters, their names and sounds.", focus: "the 28 Arabic letters: their names, their sounds and the letters that sound like ones in the student's own language. Go a few letters at a time and ask the student to repeat", practice: [ref("1:1")] },
  { id: "arabic-harakat", title: "Harakat: fatha, kasra, damma", summary: "Short vowels, sukun, shaddah and tanween.", focus: "the short vowels (fatha, kasra, damma), sukun, shaddah and tanween, with simple syllables the student repeats", practice: [ref("112:1"), ref("112:2")] },
  { id: "arabic-joining", title: "Joining letters into words", summary: "How letters change shape and connect.", focus: "how Arabic letters connect and change shape at the start, middle and end of a word, reading short Quranic words together", practice: [ref("112:3"), ref("112:4")] },
  { id: "arabic-fatihah", title: "Al-Fatihah word by word", summary: "Understand every word you say in salah.", focus: "the meaning of Surah Al-Fatihah word by word, using the verified text, so the student understands what they recite in salah", practice: [ref("1:2"), ref("1:5"), ref("1:6")] },
  { id: "arabic-names", title: "Words for Allah and His names", summary: "Allah, Rabb, Rahman, Raheem, Malik.", focus: "common Quranic words for Allah and His names (Allah, Rabb, ar-Rahman, ar-Raheem, Malik) with their meanings and roots", practice: [ref("1:3"), ref("1:4")] },
  { id: "arabic-pronouns", title: "Pronouns: huwa, hiya, hum", summary: "He, she, they, you, I — in the Quran.", focus: "Arabic personal pronouns (ana, anta, anti, huwa, hiya, nahnu, hum) with short Quranic examples", practice: [ref("112:1")] },
  { id: "arabic-verbs", title: "Verbs: past and present", summary: "kataba / yaktubu and the three-letter root.", focus: "the three-letter root and past versus present verbs (kataba, yaktubu; 'alima, ya'lamu) with Quranic examples", practice: [ref("96:1"), ref("96:4"), ref("96:5")] },
  { id: "arabic-short-surahs", title: "Understanding short surahs", summary: "Al-Ikhlas, Al-Falaq and An-Nas.", focus: "the meaning of the short surahs Al-Ikhlas, Al-Falaq and An-Nas phrase by phrase, using the verified text", practice: [ref("113:1"), ref("114:1")] },
].map((l) => ({ ...l, track: "arabic" as const, topic: "arabic" as const }));

const fiqh: Lesson[] = [
  { id: "fiqh-taharah", title: "Taharah: purity and water", summary: "What is pure, what is impure, and why it matters.", focus: "taharah: the kinds of water, what makes something impure and how to clean it" },
  { id: "fiqh-wudu", title: "Wudu step by step", summary: "How to make wudu and what breaks it.", focus: "how to perform wudu step by step, its fard and sunnah acts, and what breaks it" },
  { id: "fiqh-ghusl", title: "Ghusl and tayammum", summary: "When ghusl is needed, and dry ablution.", focus: "when ghusl becomes necessary, how to perform it, and how and when to make tayammum" },
  { id: "fiqh-salah-times", title: "Salah: times and conditions", summary: "The five prayers, their times and conditions.", focus: "the five daily prayers, their times, and the conditions that must be met before salah" },
  { id: "fiqh-how-to-pray", title: "How to pray, step by step", summary: "From takbir to tasleem.", focus: "how to pray two rak'ahs step by step from takbir to tasleem, with what is recited in each position", practice: [ref("1:1"), ref("112:1")] },
  { id: "fiqh-sahw", title: "Mistakes in salah (sajdah as-sahw)", summary: "What to do when you forget in prayer.", focus: "sajdah as-sahw: when it is needed and how it is done" },
  { id: "fiqh-fasting", title: "Fasting in Ramadan", summary: "Who fasts, what breaks it, and making up fasts.", focus: "fasting in Ramadan: who must fast, what breaks the fast, exemptions and making up missed fasts" },
  { id: "fiqh-zakat", title: "Zakat basics", summary: "Nisab, who pays and who receives.", focus: "the basics of zakat: nisab, which wealth is counted, the rate and who may receive it" },
  { id: "fiqh-halal", title: "Halal and haram in daily life", summary: "Food, earnings and dealings.", focus: "halal and haram in daily life: food, earnings, trade and honest dealings" },
].map((l) => ({ ...l, practice: l.practice ?? [], track: "fiqh" as const, topic: "fiqh" as const }));

export const LESSONS: Lesson[] = [...tajweed, ...arabic, ...fiqh];

export const TRACKS: { id: TrackId; title: string; arabic: string; blurb: string }[] = [
  { id: "tajweed", title: "Tajweed", arabic: "التجويد", blurb: "Recite beautifully: noon sakin, meem sakin, qalqalah, madd and more — from The Little Tajweed Guide." },
  { id: "arabic", title: "Quranic Arabic", arabic: "العربية", blurb: "From letters to understanding Al-Fatihah — taught in English, Hindi, Urdu, Telugu, Marathi or Hyderabadi Roman Urdu." },
  { id: "fiqh", title: "Fiqh & masail", arabic: "الفقه", blurb: "Purity, wudu, salah, fasting and zakat — clear steps from mainstream scholarship." },
];

export const isTrackId = (v: unknown): v is TrackId => v === "tajweed" || v === "arabic" || v === "fiqh";
export const lessonsFor = (track: TrackId) => LESSONS.filter((l) => l.track === track);
export const getLesson = (id: unknown) => (typeof id === "string" ? LESSONS.find((l) => l.id === id) : undefined);
