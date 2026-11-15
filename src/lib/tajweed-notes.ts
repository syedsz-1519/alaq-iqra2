/**
 * Summary of "The Little Tajweed Guide" (Mutahharah, compiled by Binte Muzaffar,
 * first edition, riwayah Hafs 'an 'Asim), supplied by the app owner as Zaid's Tajweed syllabus.
 * Examples are kept as Quran references so the verified Arabic is always fetched from the Quran text.
 */
export const TAJWEED_SOURCE =
  "The Little Tajweed Guide — Mutahharah, compiled by Binte Muzaffar (riwayah Hafs 'an 'Asim)";

export type TajweedTopic = {
  id: string;
  chapter: string;
  title: string;
  letters?: string;
  explanation: string;
  examples: { ref: string; note?: string }[];
  remember: string;
  verify?: string;
};

export const TAJWEED_TOPICS: TajweedTopic[] = [
  {
    id: "izhar-halqi",
    chapter: "Chapter 1 · Noon sakin & tanween",
    title: "Izhar Halqi — clear pronunciation from the throat",
    letters: "ء ه ع ح غ خ",
    explanation:
      "Noon sakin is a noon with a sukun; tanween is the double vowel at the end of a noun, pronounced with a noon sound. Both follow the same four rules depending on the next letter. In Izhar Halqi, pronounce the noon clearly — no merging and no extra nasal sound — when a throat letter follows.",
    examples: [{ ref: "39:23" }, { ref: "1:7" }, { ref: "2:10" }],
    remember: "Throat letter after the noon? Say the noon clearly.",
  },
  {
    id: "idgham",
    chapter: "Chapter 1 · Noon sakin & tanween",
    title: "Idgham — merging",
    letters: "ي ر م ل و ن (with ghunnah: ي ن م و · without: ل ر)",
    explanation:
      "The noon merges into the letter after it; it occurs between two words. With ghunnah (ي ن م و) the noon merges and a nasal sound is held for about two counts. Without ghunnah (ل ر) it merges completely with no nasal sound. Idgham Kamil is complete merging (into ل ر, and into ن م where ghunnah remains); Idgham Naqis is incomplete (into ي و, a trace of the noon remains with ghunnah). Same-word exception: if noon sakin and ي or و are in one word there is no idgham — pronounce the noon clearly (Izhar Mutlaq).",
    examples: [
      { ref: "2:8", note: "with ghunnah" },
      { ref: "111:5", note: "with ghunnah" },
      { ref: "99:7", note: "tanween, with ghunnah" },
      { ref: "2:5", note: "without ghunnah" },
      { ref: "2:2", note: "tanween, without ghunnah" },
      { ref: "13:4", note: "same-word exception" },
      { ref: "61:4", note: "same-word exception" },
    ],
    remember: "The letters spell يَرْمَلُونَ. Only ل and ر merge without ghunnah. Idgham needs two words; one word means izhar.",
    verify: "Teachers use the terms Kamil and Naqis slightly differently — follow your teacher's wording.",
  },
  {
    id: "iqlab",
    chapter: "Chapter 1 · Noon sakin & tanween",
    title: "Iqlab — changing",
    letters: "ب",
    explanation:
      "When noon sakin or tanween is followed by ب, it changes into a hidden meem sound. The lips come together lightly and a nasal sound is held for about two counts.",
    examples: [{ ref: "2:27" }, { ref: "2:33" }, { ref: "22:61" }],
    remember: "Noon before ب sounds like a hidden meem.",
  },
  {
    id: "ikhfa-haqiqi",
    chapter: "Chapter 1 · Noon sakin & tanween",
    title: "Ikhfa Haqiqi — concealing",
    letters: "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك",
    explanation:
      "The noon is neither fully clear nor fully merged. The tongue does not touch the place of the noon, and a nasal sound is held for about two counts. The ghunnah takes on the quality of the following letter: heavier before heavy letters.",
    examples: [{ ref: "2:97" }, { ref: "2:4" }, { ref: "2:25", note: "tanween" }],
    remember: "Fifteen letters. If it is not izhar, idgham or iqlab, it is ikhfa.",
  },
  {
    id: "meem-sakin",
    chapter: "Chapter 2 · Meem sakin",
    title: "Meem sakin — three rules",
    letters: "ب · م · all others",
    explanation:
      "1) Ikhfa Shafawi (lip concealing) before ب: lips stay lightly together with a nasal sound for about two counts. 2) Idgham Shafawi (lip merging) before another م: the two meems merge with ghunnah for about two counts. 3) Izhar Shafawi (lip clarity) before any other letter: pronounce the meem clearly, taking extra care before و and ف so it is not hidden.",
    examples: [
      { ref: "105:4", note: "Ikhfa Shafawi" },
      { ref: "3:101", note: "Ikhfa Shafawi" },
      { ref: "106:4", note: "Idgham Shafawi" },
      { ref: "2:249", note: "Idgham Shafawi" },
      { ref: "2:25", note: "Izhar Shafawi" },
      { ref: "1:7", note: "Izhar Shafawi" },
    ],
    remember: "ب hides it, م merges it, anything else shows it.",
  },
  {
    id: "ghunnah",
    chapter: "Chapter 3 · Ghunnah",
    title: "Ghunnah — the nasal sound",
    explanation:
      "Ghunnah is a nasal sound produced in the nasal passage; it belongs to noon and meem. Full ghunnah is held for about two counts in: noon or meem with shaddah, idgham with ghunnah, iqlab, ikhfa haqiqi, ikhfa shafawi and idgham shafawi. In izhar the noon or meem is clear and the ghunnah is not prolonged.",
    examples: [{ ref: "2:6", note: "shaddah" }, { ref: "2:28", note: "shaddah" }],
    remember: "Two counts, nasal, steady. Do not stop the sound early.",
  },
  {
    id: "qalqalah",
    chapter: "Chapter 4 · Qalqalah",
    title: "Qalqalah — echo / bounce",
    letters: "ق ط ب ج د",
    explanation:
      "A light release of the sound when one of these letters has sukun. It is a release of the letter itself, not a vowel — do not add 'a', 'eh' or 'uh'. Sughra (minor): sukun in the middle of a word, or at the end while you continue. Kubra (major): when you stop on the letter; strongest with shaddah.",
    examples: [
      { ref: "2:27", note: "Sughra" },
      { ref: "2:19", note: "Sughra" },
      { ref: "110:2", note: "Sughra" },
      { ref: "113:1", note: "Kubra, stopping" },
      { ref: "111:1", note: "Kubra with shaddah" },
      { ref: "112:3", note: "connecting = Sughra, stopping = Kubra" },
    ],
    remember: "Echo, not vowel. Stronger when you stop.",
    verify: "Some teachers describe three levels — use your teacher's classification.",
  },
  {
    id: "madd",
    chapter: "Chapter 5 · Madd",
    title: "Madd — lengthening",
    letters: "ا after fathah · و sakin after dammah · ي sakin after kasrah",
    explanation:
      "Madd Tabee'i (natural): no extra cause, 2 counts. Madd Muttasil: hamzah in the same word after the madd letter, commonly 4–5 counts, required. Madd Munfasil: madd letter at the end of one word and hamzah at the start of the next, commonly 4–5 counts (2 also taught), permitted. Madd 'Arid lis-Sukun: stopping on a word after a madd letter, 2, 4 or 6 counts (only 2 when connecting). Madd Lazim: permanent sukun or shaddah after the madd letter, always 6 counts.",
    examples: [
      { ref: "2:30", note: "Tabee'i" },
      { ref: "2:19", note: "Muttasil" },
      { ref: "110:1", note: "Muttasil" },
      { ref: "108:1", note: "Munfasil" },
      { ref: "2:21", note: "Munfasil" },
      { ref: "1:2", note: "'Arid lis-Sukun" },
      { ref: "1:7", note: "Lazim" },
      { ref: "69:1", note: "Lazim" },
      { ref: "2:1", note: "Lazim on the letters lam and meem" },
    ],
    remember: "Same word = Muttasil, two words = Munfasil. Lazim is always 6; 'Arid depends on stopping. Keep your chosen length consistent.",
    verify: "Muttasil some teachers allow up to 6; Munfasil lengths vary — verify with a qualified Tajweed teacher.",
  },
  {
    id: "lam-allah",
    chapter: "Chapter 6 · Lam & Ra",
    title: "Lam in the name of Allah",
    explanation:
      "Heavy (tafkhim) after a fathah or dammah; light (tarqiq) after a kasrah. Beginning a recitation with the name of Allah is not covered — ask your teacher.",
    examples: [
      { ref: "110:1", note: "heavy" },
      { ref: "2:225", note: "heavy" },
      { ref: "1:1", note: "light" },
      { ref: "2:8", note: "light" },
    ],
    remember: "Fathah or dammah, heavy. Kasrah, light.",
  },
  {
    id: "ra",
    chapter: "Chapter 6 · Lam & Ra",
    title: "Ra — heavy or light",
    explanation:
      "Heavy when ra has a fathah or dammah; light when it has a kasrah. Ra with sukun: look at the letter before it — after fathah or dammah it is heavy; after kasrah it is light, unless a heavy letter follows in the same word. More detailed conditions (stopping, heavy letter after kasrah) are learnt with a teacher.",
    examples: [
      { ref: "1:2", note: "heavy" },
      { ref: "2:25", note: "heavy and light" },
      { ref: "2:185", note: "sukun after fathah — heavy" },
      { ref: "2:49", note: "sukun after kasrah — light" },
    ],
    remember: "Vowel first. For ra with sukun, check the letter before.",
  },
  {
    id: "hamzah",
    chapter: "Chapter 7 · Hamzah",
    title: "Hamzatul Wasl and Hamzatul Qat'",
    explanation:
      "Hamzatul Qat' (cutting) is always pronounced, at the beginning and when connecting. Hamzatul Wasl (connecting) is pronounced only when you begin with it and is silent when connecting. Beginning: with 'al' begin with a fathah; with a verb look at the third letter — if it has a dammah begin with a dammah, otherwise a kasrah.",
    examples: [
      { ref: "1:6", note: "wasl silent when joined to 1:5; begins with kasrah" },
      { ref: "1:2", note: "'al' — begin with fathah" },
      { ref: "7:143", note: "begins with dammah" },
    ],
    remember: "Qat' never disappears. Wasl disappears when you connect.",
  },
];

export const TAJWEED_REVIEW: { q: string; a: string }[] = [
  { q: "Name the four rules of noon sakin and tanween.", a: "Izhar Halqi, Idgham, Iqlab, Ikhfa Haqiqi." },
  { q: "List the six letters of Izhar Halqi.", a: "ء ه ع ح غ خ (hamzah, ha, 'ayn, ḥa, ghayn, kha)." },
  { q: "Which letters give idgham with ghunnah, and which without?", a: "With ghunnah: ي ن م و. Without: ل ر." },
  { q: "Which letter causes Iqlab, and what happens to the noon?", a: "ب. The noon becomes a hidden meem sound." },
  { q: "How many letters cause Ikhfa Haqiqi?", a: "Fifteen." },
  { q: "What is the rule of meem sakin before ب?", a: "Ikhfa Shafawi." },
  { q: "For how long is full ghunnah held?", a: "About two counts." },
  { q: "Name the five qalqalah letters.", a: "ق ط ب ج د (qaf, ṭa, ba, jeem, dal)." },
  { q: "What is the difference between Madd Muttasil and Madd Munfasil?", a: "Muttasil: hamzah in the same word. Munfasil: hamzah in the next word." },
  { q: "Which hamzah is silent when connecting words?", a: "Hamzatul Wasl." },
];

export const TAJWEED_REMINDER =
  "This guide is a revision aid. It cannot correct your recitation and cannot replace a teacher who hears you recite. If your teacher teaches a detail differently, follow your teacher.";

export function tajweedNotesText(topicId?: string) {
  const topics = topicId ? TAJWEED_TOPICS.filter((t) => t.id === topicId) : TAJWEED_TOPICS;
  return topics
    .map(
      (t) =>
        `${t.title} (${t.chapter})${t.letters ? `\nLetters: ${t.letters}` : ""}\n${t.explanation}\nExamples: ${t.examples
          .map((e) => `Quran ${e.ref}${e.note ? ` (${e.note})` : ""}`)
          .join("; ")}\nRemember: ${t.remember}${t.verify ? `\nNote: ${t.verify}` : ""}`,
    )
    .join("\n\n");
}
