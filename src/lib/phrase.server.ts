import { transcribeAudio } from "@lovable.dev/ai-gateway";
import { friendlyAiError } from "./ai.server";
import { compareRecitation } from "./assignments";
import { ayahWordsUrl, parseAyahWords, phrasePassed, phraseText, splitPhrases } from "./phrases";

/** Checks one recited phrase against the verified Quran.com words (the server fetches the text itself). */
export async function checkPhraseServer(d: { surah: number; ayah: number; phrase: number; audio: string; mime: string }) {
  const res = await fetch(ayahWordsUrl(d.surah, d.ayah));
  if (!res.ok) throw new Error("Couldn't load this ayah");
  const words = parseAyahWords(await res.json());
  const p = splitPhrases(words)[d.phrase];
  if (!p) throw new Error("Unknown phrase");
  const expected = phraseText(words, p);

  const bin = atob(d.audio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const format = d.mime.includes("mp4") || d.mime.includes("m4a") ? "mp4" : d.mime.includes("ogg") ? "ogg" : d.mime.includes("wav") ? "wav" : "webm";

  let heard = "";
  try {
    const t = await transcribeAudio({
      model: "openai/gpt-transcribe",
      file: new File([bytes], `phrase.${format}`, { type: d.mime || "audio/webm" }),
      language: "ar",
    });
    heard = (t as { text?: string }).text?.trim() ?? "";
  } catch (e) {
    throw friendlyAiError(e);
  }
  const c = compareRecitation(expected, heard);
  return { score: c.score, passed: phrasePassed(c.score), heard, missing: c.missing, extra: c.extra };
}
