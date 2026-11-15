/** Word-by-word ayah data from Quran.com (verified Uthmani text + per-word recitation audio). */
export type PhraseWord = { text: string; transliteration: string; translation: string; audio: string | null };
export type Phrase = { start: number; end: number };

const PAUSE_MARKS = /[\u06D6-\u06DC]/;
export const MAX_PHRASE_WORDS = 4;

export const ayahWordsUrl = (surah: number, ayah: number) =>
  `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani&language=en`;

type ApiWord = {
  char_type_name: string;
  text_uthmani?: string;
  audio_url?: string | null;
  translation?: { text?: string };
  transliteration?: { text?: string | null };
};

export function parseAyahWords(json: unknown): PhraseWord[] {
  const words = (json as { verse?: { words?: ApiWord[] } }).verse?.words ?? [];
  return words
    .filter((w) => w.char_type_name === "word" && w.text_uthmani)
    .map((w) => ({
      text: w.text_uthmani!,
      transliteration: w.transliteration?.text ?? "",
      translation: (w.translation?.text ?? "").trim(),
      audio: w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null,
    }));
}

/** Splits an ayah into short phrases: break at the Mushaf's pause marks, and never more than MAX_PHRASE_WORDS words. */
export function splitPhrases(words: Pick<PhraseWord, "text">[], max = MAX_PHRASE_WORDS): Phrase[] {
  const out: Phrase[] = [];
  let start = 0;
  words.forEach((w, i) => {
    const len = i - start + 1;
    const last = i === words.length - 1;
    if (last || PAUSE_MARKS.test(w.text) || len >= max) {
      out.push({ start, end: i });
      start = i + 1;
    }
  });
  // Fold a lone trailing word into the previous phrase when it still fits the pause rule.
  const tail = out[out.length - 1];
  const prev = out[out.length - 2];
  if (tail && prev && tail.start === tail.end && prev.end - prev.start + 1 < max && !PAUSE_MARKS.test(words[prev.end]!.text)) {
    out.splice(-2, 2, { start: prev.start, end: tail.end });
  }
  return out;
}

export const phraseText = (words: Pick<PhraseWord, "text">[], p: Phrase) =>
  words
    .slice(p.start, p.end + 1)
    .map((w) => w.text)
    .join(" ");

/** A phrase counts as recited correctly when at least this share of its words was heard. */
export const PASS_SCORE = 80;
export const phrasePassed = (score: number) => score >= PASS_SCORE;
