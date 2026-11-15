import { GatewayError, generateChatCompletion, generateSpeech, transcribeAudio } from "@lovable.dev/ai-gateway";

import duasData from "@/data/duas.json";

import { compareRecitation, getAssignment } from "./assignments";
import { LANGS, cleanTranslation, extraTranslationUrls, type LangId } from "./quran";
import { RUBRICS, type RubricResult } from "./rubric";
import { tajweedNotesText } from "./tajweed-notes";
import { getTeacher, type Teacher } from "./teachers";


function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function friendlyAiError(e: unknown): Error {
  if (e instanceof GatewayError) {
    if (e.code === "payment_required" || e.httpStatus === 402) return new Error("Your teacher's AI credits have run out. Please try again later.");
    if (e.httpStatus === 429) return new Error("Your teacher is busy right now. Please wait a minute and try again.");
    return new Error("Your teacher couldn't process that just now. Please try again.");
  }
  return e instanceof Error ? e : new Error("Something went wrong");
}

export async function speak(text: string, style: string, voiceName: string = getTeacher("zaid").ttsVoice) {
  const audio = await generateSpeech({
    model: "google/gemini-3.1-flash-tts-preview",
    contents: [{ role: "user", parts: [{ text: `${style}\n\n${text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  const blob = await audio.blob();
  return { audio: toBase64(new Uint8Array(await blob.arrayBuffer())), mime: blob.type || "audio/wav" };
}

/** Speaks one ayah's published translation (Telugu/Marathi have no human narration). */
export async function speakTranslationServer(d: { lang: LangId; surah: number; ayah: number }) {
  let verses: string[] | undefined;
  for (const url of extraTranslationUrls(d.lang, d.surah)) {
    const res = await fetch(url);
    if (res.ok) {
      verses = ((await res.json()) as { chapter: { text: string }[] }).chapter.map((v) => cleanTranslation(v.text));
      break;
    }
  }
  const text = verses?.[d.ayah - 1];
  if (!text) throw new Error("Translation not found");
  try {
    return await speak(text, `Read this ${LANGS[d.lang].label} translation of a verse of the Quran aloud, exactly as written, in a calm, reverent voice:`);
  } catch (e) {
    throw friendlyAiError(e);
  }
}

type DuaCat = { id: number; items: { id: number; arabic: string }[] };

async function expectedArabic(assignmentId: string) {
  const a = getAssignment(assignmentId);
  if (!a) throw new Error("Unknown assignment");
  if (a.kind === "quran") {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${a.surah}/quran-uthmani?offset=${a.from - 1}&limit=${a.to - a.from + 1}`);
    if (!res.ok) throw new Error("Couldn't load the ayahs to compare");
    const ayahs = ((await res.json()) as { data: { ayahs: { numberInSurah: number; text: string }[] } }).data.ayahs;
    return {
      a,
      text: ayahs
        .map((x) =>
          a.surah !== 1 && a.surah !== 9 && x.numberInSurah === 1
            ? x.text.replace(/^\uFEFF?بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ\s*/, "")
            : x.text,
        )
        .join(" "),
    };
  }
  if (a.kind === "dua") {
    const cat = (duasData as DuaCat[]).find((c) => c.id === a.category);
    const item = cat?.items.find((i) => i.id === a.item);
    if (!item) throw new Error("Dua not found");
    return { a, text: item.arabic.replace(/[()﴿﴾.«»]/g, " ") };
  }
  return { a, text: "" };
}

const FEEDBACK_LANG: Record<string, string> = { en: "English", hi: "Hindi (Devanagari script)", ur: "Urdu (Urdu script)", roman: "Hyderabadi Roman Urdu (Urdu in Latin letters, the gentle Hyderabadi way)", te: "Telugu", mr: "Marathi" };

export type CheckResult = {
  transcript: string;
  score: number;
  missing: string[];
  extra: string[];
  rubric: RubricResult[];
  correct?: "correct" | "partly" | "incorrect";
  summary: string;
  tips: string[];
  audio?: string;
  mime?: string;
};

export async function checkRecitationServer(d: { assignmentId: string; audio: string; mime: string; feedbackLang: string; teacher?: string | undefined }): Promise<CheckResult> {
  const teacher: Teacher = getTeacher(d.teacher);
  const persona = `${teacher.name}, a humble, soft-spoken and kind Tajweed teacher (${teacher.role === "sister" ? "a sister" : "a brother"})`;
  const { a, text: expected } = await expectedArabic(d.assignmentId);
  const bytes = fromBase64(d.audio);
  const format = d.mime.includes("mp4") || d.mime.includes("m4a") ? "mp4" : d.mime.includes("ogg") ? "ogg" : d.mime.includes("wav") ? "wav" : "webm";
  const lang = FEEDBACK_LANG[d.feedbackLang] ?? "English";

  try {
    let transcript = "";
    let comparison = { score: 0, missing: [] as string[], extra: [] as string[] };
    if (a.kind !== "question") {
      const t = await transcribeAudio({
        model: "openai/gpt-transcribe",
        file: new File([bytes], `recitation.${format}`, { type: d.mime || "audio/webm" }),
        language: "ar",
      });
      transcript = (t as { text?: string }).text?.trim() ?? "";
      comparison = compareRecitation(expected, transcript);
    }

    const rubricSpec = a.kind === "question" ? [] : RUBRICS;
    const prompt =
      a.kind === "question"
        ? `You are ${persona}. The student answered this review question aloud.
Question: ${a.question}
Answer key: ${a.answer}
Listen to the recording and judge the answer against the key. Reply as JSON:
{"transcript": string (what they said), "correct": "correct"|"partly"|"incorrect", "summary": string (in ${lang}, max 60 words, warm, explain the right answer), "tips": string[] (max 2, in ${lang})}`
        : `You are ${persona}, fair and gentle (riwayah Hafs 'an 'Asim). Listen to the student's recitation.
Assignment: ${a.title}. Focus: ${a.focus}.
Expected Arabic: ${expected}
Automatic transcript: ${transcript || "(nothing recognised)"}
Word match: ${comparison.score}% — missing words: ${comparison.missing.join(" ") || "none"}; extra words: ${comparison.extra.join(" ") || "none"}.
Syllabus notes:
${tajweedNotesText("qalqalah")}
${tajweedNotesText("ghunnah")}

Rate each rubric criterion from what you actually hear:
${rubricSpec.map((r) => r.criteria.map((c) => `- ${c.id}: ${c.label} — ${c.check}`).join("\n")).join("\n")}
Ratings: "good" (clearly correct), "practice" (clearly needs work — say where), "not_heard" (this rule does not occur in the passage, or the audio is unclear). Be fair: do not invent mistakes, and use "not_heard" when unsure.
Reply as JSON:
{"rubric": [{"id": string, "rating": "good"|"practice"|"not_heard", "note": string (in ${lang}, max 20 words, name the word)}], "summary": string (in ${lang}, max 60 words, warm, polite and encouraging, as ${teacher.name} speaking respectfully to the student), "tips": string[] (max 3, in ${lang})}`;

    const r = await generateChatCompletion({
      model: "google/gemini-3.8-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "input_audio", input_audio: { data: d.audio, format } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });
    const content = r.choices?.[0]?.message?.content;
    const raw = typeof content === "string" ? content : "";
    let parsed: {
      transcript?: string;
      correct?: CheckResult["correct"];
      rubric?: { id: string; rating: string; note?: string }[];
      summary?: string;
      tips?: string[];
    } = {};
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      parsed = { summary: raw.slice(0, 400) };
    }
    const rubric: RubricResult[] = rubricSpec.flatMap((group) =>
      group.criteria.map((c) => {
        const got = parsed.rubric?.find((x) => x.id === c.id);
        const rating = got?.rating === "good" || got?.rating === "practice" ? got.rating : "not_heard";
        return { id: c.id, group: group.id, rating, note: String(got?.note ?? "").slice(0, 200) };
      }),
    );
    const summary = String(parsed.summary ?? "").slice(0, 600);
    const tips = (Array.isArray(parsed.tips) ? parsed.tips : []).map(String).slice(0, 3);
    const correct = a.kind === "question" ? (parsed.correct ?? "partly") : undefined;
    const score =
      a.kind === "question" ? (correct === "correct" ? 100 : correct === "partly" ? 50 : 0) : comparison.score;

    let voice: { audio?: string; mime?: string } = {};
    if (summary) {
      try {
        voice = await speak(summary, "Say this softly, politely and humbly, like a caring teacher giving gentle feedback to a student:", teacher.ttsVoice);
      } catch {
        voice = {};
      }
    }
    return {
      transcript: a.kind === "question" ? String(parsed.transcript ?? "") : transcript,
      score,
      missing: comparison.missing,
      extra: comparison.extra,
      rubric,
      ...(correct ? { correct } : {}),
      summary,
      tips,
      ...voice,
    };
  } catch (e) {
    throw friendlyAiError(e);
  }
}
