/**
 * /api/chat - Server function for Zaid/Zara voice assistant
 * 
 * POST /api/chat
 * Body: {
 *   message: string,
 *   persona: "zaid" | "zara" | "text",
 *   lang: "en" | "ur" | "hi",
 *   history?: { role: "user" | "assistant", content: string }[]
 * }
 * 
 * Response: {
 *   response: string (streaming or immediate),
 *   sources: Array<{ type: "quran" | "hadith" | "dua", ref: string, content: string, translation?: string }>,
 *   error?: string
 * }
 */

import { createServerFn } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { getHeader } from "@tanstack/react-start/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rate limiting store (in-memory for free tier; use Upstash for production)
const rateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

const RATE_LIMIT_PER_DAY = 100;
const RATE_LIMIT_WINDOW = 86400000; // 24 hours

function getRateLimitKey(ip: string): string {
  return `${ip}:${new Date().toDateString()}`;
}

function checkRateLimit(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const limit = rateLimitStore.get(key);

  if (!limit || limit.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_PER_DAY) {
    return false;
  }

  limit.count++;
  return true;
}

interface SourceResult {
  type: "quran" | "hadith" | "dua";
  ref: string;
  arabic?: string;
  content: string;
  translation?: string;
  grading?: string;
}

async function retrieveContext(
  query: string,
  lang: string
): Promise<SourceResult[]> {
  // First, try exact lookups (e.g., "2:255", "Ayat al-Kursi", "Bukhari 1")
  const exactMatch = parseExactReference(query);

  if (exactMatch) {
    if (exactMatch.type === "quran") {
      const { data } = await supabase.rpc("get_verse", {
        p_surah: exactMatch.surah,
        p_ayah: exactMatch.ayah,
      });

      if (data?.[0]) {
        const verse = data[0];
        const trans = verse.translations?.[lang] || verse.translations?.en;
        return [
          {
            type: "quran",
            ref: `${verse.surah}:${verse.ayah}`,
            arabic: verse.arabic,
            content: verse.arabic,
            translation: trans?.text || "",
          },
        ];
      }
    }

    if (exactMatch.type === "hadith") {
      const { data } = await supabase.rpc("get_hadith", {
        p_collection: exactMatch.collection,
        p_number: exactMatch.number,
      });

      if (data?.[0]) {
        const hadith = data[0];
        const trans = hadith.translations?.[lang] || hadith.translations?.en;
        return [
          {
            type: "hadith",
            ref: `${hadith.collection} ${hadith.number}`,
            arabic: hadith.arabic,
            content: hadith.arabic,
            translation: trans?.text || "",
            grading: hadith.grading || "Grading not available",
          },
        ];
      }
    }
  }

  // Fall back to semantic search
  const results: SourceResult[] = [];

  // For free tier, use simple full-text search (no vector embeddings yet)
  // Vector search will be added once embeddings are generated
  const { data: chunks } = await supabase
    .from("chunks")
    .select("id, kind, ref, content, metadata, surah_ayah, collection_number")
    .eq("lang", lang)
    .or(`kind.eq.quran,kind.eq.hadith,kind.eq.dua`)
    .limit(5);

  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.kind === "quran" && chunk.surah_ayah) {
        const [surah, ayah] = chunk.surah_ayah.split(":").map(Number);
        const { data: verse } = await supabase.rpc("get_verse", {
          p_surah: surah,
          p_ayah: ayah,
        });

        if (verse?.[0]) {
          const v = verse[0];
          const trans = v.translations?.[lang] || v.translations?.en;
          results.push({
            type: "quran",
            ref: `${v.surah}:${v.ayah}`,
            arabic: v.arabic,
            content: v.arabic,
            translation: trans?.text || "",
          });
        }
      }

      if (chunk.kind === "hadith" && chunk.collection_number) {
        const [collection, number] = chunk.collection_number
          .split(":")
          .map((x) => (isNaN(Number(x)) ? x : Number(x)));
        const { data: hadith } = await supabase.rpc("get_hadith", {
          p_collection: collection,
          p_number: number,
        });

        if (hadith?.[0]) {
          const h = hadith[0];
          const trans = h.translations?.[lang] || h.translations?.en;
          results.push({
            type: "hadith",
            ref: `${h.collection} ${h.number}`,
            arabic: h.arabic,
            content: h.arabic,
            translation: trans?.text || "",
            grading: h.grading || "Grading not available",
          });
        }
      }
    }
  }

  return results;
}

function parseExactReference(
  query: string
): { type: "quran" | "hadith"; surah?: number; ayah?: number; collection?: string; number?: number } | null {
  // Parse "2:255", "Surah 2 Ayah 255", "Ayat al-Kursi", "Bukhari 1"
  const verseMatch = query.match(/(\d+):(\d+)/);
  if (verseMatch) {
    return {
      type: "quran",
      surah: parseInt(verseMatch[1]),
      ayah: parseInt(verseMatch[2]),
    };
  }

  const hadiths = ["bukhari", "muslim", "tirmidhi", "nasai", "abudawood"];
  for (const collection of hadiths) {
    const match = query.match(
      new RegExp(`${collection}\\s+(\\d+)`, "i")
    );
    if (match) {
      return {
        type: "hadith",
        collection: collection.toLowerCase(),
        number: parseInt(match[1]),
      };
    }
  }

  return null;
}

async function callLLM(
  query: string,
  context: SourceResult[],
  persona: string,
  lang: string,
  history?: Array<{ role: string; content: string }>
): Promise<string> {
  if (!GROQ_API_KEY) {
    // Fallback: no LLM available, return formatted context
    return formatContextAsResponse(context, lang);
  }

  const systemPrompt = buildSystemPrompt(persona, lang, context);
  const userMessage = `${query}\n\nBased on the Islamic knowledge base provided, please answer.`;

  const messages = [
    ...(history || []),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[LLM] Error:", error);
      // Fallback to context
      return formatContextAsResponse(context, lang);
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message.content || formatContextAsResponse(context, lang);
  } catch (err) {
    console.error("[LLM] Exception:", err);
    return formatContextAsResponse(context, lang);
  }
}

function buildSystemPrompt(
  persona: string,
  lang: string,
  context: SourceResult[]
): string {
  const tone =
    persona === "zaid"
      ? "You are Zaid, a warm, calm, and respectful Islamic knowledge assistant. Speak in a gentle, understanding tone."
      : "You are Zara, a friendly, clear, and encouraging Islamic knowledge assistant. Be warm and supportive.";

  const contextStr = context
    .map(
      (s) =>
        `[${s.type.toUpperCase()} ${s.ref}]: ${s.translation || s.content}`
    )
    .join("\n");

  return `${tone}

You are provided with Islamic texts from the Quran, hadith, and duas. Your role is to:
1. Answer questions ONLY based on the provided context.
2. Always cite your sources (e.g., "Surah 2, Ayah 255" or "Sahih Bukhari 1").
3. Never invent facts or make up Islamic teachings.
4. For fiqh questions, acknowledge that scholars may differ and suggest consulting a qualified scholar.
5. If asked something outside your knowledge base, politely say so and suggest asking a scholar or contacting Alaq.

Language: ${lang === "en" ? "English" : lang === "ur" ? "Urdu" : "Hindi/Hinglish"}

Context:
${contextStr}

Keep answers concise (2-3 sentences for voice, fuller for text). Always be respectful of Islamic principles.`;
}

function formatContextAsResponse(context: SourceResult[], lang: string): string {
  if (context.length === 0) {
    return lang === "ur"
      ? "معافی کے ساتھ، میں اس سوال کا جواب نہیں دے سکتا۔ براہ کرم ایک قابل تعریف عالم سے رابطہ کریں۔"
      : lang === "hi"
        ? "माफ़ी चाहता हूँ, मैं इस सवाल का जवाब नहीं दे सकता। कृपया एक योग्य विद्वान से संपर्क करें।"
        : "I apologize, but I couldn't find relevant information to answer that question. Please consult a qualified scholar or contact Alaq.";
  }

  const citations = context
    .map((s) => `${s.type}: ${s.ref}`)
    .join(" | ");

  return `Based on the Islamic texts: ${citations}. ${
    context[0]?.translation || context[0]?.content || ""
  }`;
}

export const chat = createServerFn({
  method: "POST",
})
  .inputType<{
    message: string;
    persona: "zaid" | "zara" | "text";
    lang: "en" | "ur" | "hi";
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  }>()
  .handler(async (input) => {
    const ip =
      (getHeader("x-forwarded-for") as string)?.split(",")[0] ||
      "127.0.0.1";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return {
        response: "Rate limit exceeded. Please try again later.",
        sources: [],
        error: "RATE_LIMIT",
      };
    }

    // Input validation
    if (!input.message || input.message.length > 500) {
      return {
        response: "Invalid input. Message too long.",
        sources: [],
        error: "INVALID_INPUT",
      };
    }

    try {
      // Retrieve context from knowledge base
      const sources = await retrieveContext(input.message, input.lang);

      // Call LLM or format context directly
      const response = await callLLM(
        input.message,
        sources,
        input.persona,
        input.lang,
        input.history
      );

      return {
        response,
        sources,
        error: undefined,
      };
    } catch (err) {
      console.error("[Chat] Error:", err);
      return {
        response: "An error occurred. Please try again.",
        sources: [],
        error: "SERVER_ERROR",
      };
    }
  });
