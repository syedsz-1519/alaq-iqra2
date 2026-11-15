/**
 * Offline lessons spoken by the phone's own text-to-speech voice (Web Speech API).
 * The script is built only from the bundled Tajweed notes, so nothing here needs the internet.
 */
import { TAJWEED_SOURCE, type TajweedTopic } from "./tajweed-notes";
import type { Teacher } from "./teachers";

export type SpeechPart = { text: string; lang: "en" | "ar"; kind: "intro" | "letters" | "body" | "remember" | "note" | "outro" };

/** Splits a paragraph into sentences so long text is spoken reliably (some phones cut off long utterances). */
export function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The spoken lesson for one Tajweed topic, read in the teacher's voice. */
export function tajweedLessonScript(topic: TajweedTopic, teacher: Pick<Teacher, "name">): SpeechPart[] {
  const parts: SpeechPart[] = [
    { kind: "intro", lang: "en", text: `Assalamu alaikum. This is ${teacher.name}. Today's lesson is ${topic.title.replace(/—/g, ",")}.` },
    { kind: "intro", lang: "en", text: `${topic.chapter.replace(/·/g, ",")}.` },
  ];
  if (topic.letters) {
    parts.push({ kind: "letters", lang: "en", text: "The letters for this rule are shown on your screen." });
    parts.push({ kind: "letters", lang: "ar", text: topic.letters });
  }
  for (const s of splitSentences(topic.explanation)) parts.push({ kind: "body", lang: "en", text: s });
  for (const s of splitSentences(`Remember: ${topic.remember}`)) parts.push({ kind: "remember", lang: "en", text: s });
  if (topic.verify) parts.push({ kind: "note", lang: "en", text: topic.verify });
  parts.push({
    kind: "outro",
    lang: "en",
    text: "Now practise the example ayahs with Repeat after me. May Allah make the Quran easy for you.",
  });
  return parts;
}

export const LESSON_SOURCE_NOTE = TAJWEED_SOURCE;

type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">;

const MALE = /\b(male|david|daniel|rishi|aaron|fred|alex|arthur|george|james|tom|ravi|hemant|prabhat|guy|ryan|google uk english male)\b/i;
const FEMALE = /\b(female|samantha|victoria|karen|moira|tessa|veena|serena|zira|susan|heera|neerja|kalpana|google uk english female|sonia|libby)\b/i;

/**
 * Picks the best installed voice for a language: on-device voices first (they work offline),
 * then voices matching the teacher (male for Zaid, female for Zara), then Indian/UK/US English.
 */
export function pickVoice<V extends VoiceLike>(voices: V[], lang: "en" | "ar", gender: "male" | "female"): V | undefined {
  const pool = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(lang));
  if (!pool.length) return undefined;
  const regionRank = (v: V) => {
    const l = v.lang.toLowerCase().replace("_", "-");
    if (lang === "ar") return l === "ar-sa" ? 0 : 1;
    return l === "en-in" ? 0 : l === "en-gb" ? 1 : l === "en-us" ? 2 : 3;
  };
  const genderRank = (v: V) => {
    const want = gender === "male" ? MALE : FEMALE;
    const avoid = gender === "male" ? FEMALE : MALE;
    return want.test(v.name) ? 0 : avoid.test(v.name) ? 2 : 1;
  };
  return [...pool].sort(
    (a, b) =>
      Number(b.localService) - Number(a.localService) || genderRank(a) - genderRank(b) || regionRank(a) - regionRank(b),
  )[0];
}
