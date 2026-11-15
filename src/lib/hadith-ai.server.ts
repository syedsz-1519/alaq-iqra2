import { generateResponse } from "@lovable.dev/ai-gateway";
import { friendlyAiError, speak } from "./ai.server";
import { getCollection } from "./hadith";

export const HADITH_URDU = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik"] as const;
export type HadithAiLang = "roman" | "te" | "mr";
export type HadithVoiceLang = "ar" | "en" | "ur" | HadithAiLang;

const LANG_NAME: Record<HadithAiLang, string> = { roman: "Roman Urdu (Urdu written in Latin letters)", te: "Telugu", mr: "Marathi" };
const SPOKEN: Record<HadithVoiceLang, string> = { ar: "Arabic", en: "English", ur: "Urdu", roman: "Urdu", te: "Telugu", mr: "Marathi" };
const BASES = ["https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions", "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions"];
const MODEL = "openai/gpt-6-astra";

function checkHadith(collection: string, number: number) {
  const c = getCollection(collection);
  if (!c || number < 1 || number > c.total + 50) throw new Error("Unknown hadith");
  return c;
}

/** Published text of one hadith from the Hadith API (never from the client). */
async function publishedText(edition: string, number: number) {
  for (const b of BASES) {
    try {
      const res = await fetch(`${b}/${edition}/${number}.min.json`);
      if (!res.ok) continue;
      const d = (await res.json()) as { hadiths: { text: string }[] };
      const t = d.hadiths[0]?.text?.trim();
      if (t) return t;
    } catch {
      /* next mirror */
    }
  }
  throw new Error("That hadith text was not found");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Roman Urdu / Telugu / Marathi: AI translation of the published English, translated once and cached. */
export async function translateHadithServer(d: { collection: string; number: number; lang: HadithAiLang }) {
  checkHadith(d.collection, d.number);
  const db = await admin();
  const { data: hit } = await db
    .from("hadith_translations")
    .select("text")
    .eq("collection", d.collection)
    .eq("hadith_number", d.number)
    .eq("lang", d.lang)
    .maybeSingle();
  if (hit?.text) return { text: hit.text, cached: true };

  const english = await publishedText(`eng-${d.collection}`, d.number);
  let text = "";
  try {
    const r = await generateResponse({
      model: MODEL,
      reasoning: { effort: "low" },
      instructions:
        `Translate this hadith from English into ${LANG_NAME[d.lang]}. Translate faithfully and completely; do not add, remove, explain or comment. ` +
        "Keep narrator names, and write ﷺ after the Prophet's name. Return only the translation.",
      input: english,
    });
    for (const item of r.output) {
      if (item.type !== "message") continue;
      for (const c of item.content) if (c.type === "output_text") text += c.text;
    }
  } catch (e) {
    throw friendlyAiError(e);
  }
  text = text.trim();
  if (!text) throw new Error("The translation came back empty. Please try again.");
  await db.from("hadith_translations").upsert({ collection: d.collection, hadith_number: d.number, lang: d.lang, text, model: MODEL });
  return { text, cached: false };
}

/** Reads a hadith aloud in Arabic or a translation. The server picks the text itself. */
export async function speakHadithServer(d: { collection: string; number: number; lang: HadithVoiceLang }) {
  checkHadith(d.collection, d.number);
  let text: string;
  if (d.lang === "ar") text = await publishedText(`ara-${d.collection}`, d.number);
  else if (d.lang === "en") text = await publishedText(`eng-${d.collection}`, d.number);
  else if (d.lang === "ur") {
    if (!(HADITH_URDU as readonly string[]).includes(d.collection)) throw new Error("No Urdu edition for this collection");
    text = await publishedText(`urd-${d.collection}`, d.number);
  } else text = (await translateHadithServer({ collection: d.collection, number: d.number, lang: d.lang })).text;

  const clipped = text.length > 2400 ? `${text.slice(0, 2400).replace(/\s+\S*$/, "")}…` : text;
  try {
    return await speak(clipped, `Read this hadith aloud in ${SPOKEN[d.lang]}, exactly as written, in a calm, respectful voice:`);
  } catch (e) {
    throw friendlyAiError(e);
  }
}
