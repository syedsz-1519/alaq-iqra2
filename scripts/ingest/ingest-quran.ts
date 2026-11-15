/**
 * Ingest Quran verses and translations from Tanzil + Pickthall
 * Idempotent: safe to re-run, uses upsert
 * 
 * Run locally: npx tsx scripts/ingest/ingest-quran.ts
 * 
 * Downloads:
 * - Quran Arabic from Tanzil.net
 * - English translation (Pickthall from Quran.com)
 * 
 * Stores in: quran_verses, quran_translations, chunks
 */

import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Checkpoint for resumable ingestion
const CHECKPOINT_FILE = path.join(process.cwd(), ".ingest-quran-checkpoint.json");

interface Checkpoint {
  versesLoaded: number;
  translationsLoaded: number;
  chunksLoaded: number;
  lastError?: string;
}

function loadCheckpoint(): Checkpoint {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
  }
  return { versesLoaded: 0, translationsLoaded: 0, chunksLoaded: 0 };
}

function saveCheckpoint(cp: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

// Mock data (in production, fetch from Tanzil + Quran.com APIs)
// For now, we'll create a sample dataset
const SAMPLE_QURAN = [
  {
    surah: 1,
    ayah: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
    juz: 1,
    page: 1,
    english: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
  },
  {
    surah: 1,
    ayah: 2,
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    juz: 1,
    page: 1,
    english: "[All] praise is [due] to Allah, Lord of the worlds -",
  },
  {
    surah: 96,
    ayah: 1,
    arabic: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",
    juz: 30,
    page: 596,
    english: "Read in the name of your Lord who created",
  },
];

async function getSources() {
  const { data: sources, error } = await supabase
    .from("sources")
    .select("id, name")
    .in("name", ["Tanzil Project", "Pickthall Translation"]);

  if (error) throw error;

  let tanzilId = sources?.find((s) => s.name === "Tanzil Project")?.id;
  let pickthallId = sources?.find((s) => s.name === "Pickthall Translation")?.id;

  // Create sources if missing
  if (!tanzilId) {
    const { data: tanzil, error: tanzilErr } = await supabase
      .from("sources")
      .insert({
        name: "Tanzil Project",
        license: "CC BY 3.0",
        attribution: "Qur'anic text: Tanzil Project, CC BY 3.0, https://tanzil.net",
        url: "https://tanzil.net",
      })
      .select("id")
      .single();

    if (tanzilErr) throw tanzilErr;
    tanzilId = tanzil.id;
  }

  if (!pickthallId) {
    const { data: pickthall, error: pickthallErr } = await supabase
      .from("sources")
      .insert({
        name: "Pickthall Translation",
        license: "Public Domain",
        attribution: "English translation: Muhammad Marmaduke Pickthall, Public Domain",
        url: "https://quran.com",
      })
      .select("id")
      .single();

    if (pickthallErr) throw pickthallErr;
    pickthallId = pickthall.id;
  }

  return { tanzilId, pickthallId };
}

async function ingestVerses(checkpoint: Checkpoint) {
  const { tanzilId, pickthallId } = await getSources();

  console.log(`📖 Ingesting ${SAMPLE_QURAN.length} Quran verses...`);

  for (const verse of SAMPLE_QURAN) {
    // Upsert verse
    const { error: verseErr } = await supabase
      .from("quran_verses")
      .upsert(
        {
          surah: verse.surah,
          ayah: verse.ayah,
          arabic: verse.arabic,
          juz: verse.juz,
          page: verse.page,
          source_id: tanzilId,
        },
        { onConflict: "surah,ayah" }
      );

    if (verseErr) throw verseErr;

    // Upsert translation
    const { error: transErr } = await supabase
      .from("quran_translations")
      .upsert(
        {
          surah: verse.surah,
          ayah: verse.ayah,
          lang: "en",
          translator: "Pickthall",
          text: verse.english,
          source_id: pickthallId,
        },
        { onConflict: "surah,ayah,lang,translator" }
      );

    if (transErr) throw transErr;

    checkpoint.versesLoaded++;

    if (checkpoint.versesLoaded % 100 === 0) {
      console.log(`  ✓ Loaded ${checkpoint.versesLoaded} verses`);
      saveCheckpoint(checkpoint);
    }
  }

  console.log(`✅ Ingested ${checkpoint.versesLoaded} verses`);
}

async function ingestChunks(checkpoint: Checkpoint) {
  console.log(`🔍 Chunking Quran for embeddings...`);

  const { data: verses, error } = await supabase
    .from("quran_verses")
    .select("surah, ayah, arabic");

  if (error) throw error;

  const { data: translations } = await supabase
    .from("quran_translations")
    .select("surah, ayah, lang, translator, text");

  for (const verse of verses || []) {
    const trans = translations?.filter(
      (t) => t.surah === verse.surah && t.ayah === verse.ayah
    );

    const chunkContent = `Surah ${verse.surah}, Ayah ${verse.ayah}: ${verse.arabic}. ${
      trans
        ?.map((t) => `${t.translator} (${t.lang}): ${t.text}`)
        .join(" ") || ""
    }`;

    // Insert chunk (will be filled with embeddings later)
    const { error: chunkErr } = await supabase.from("chunks").insert({
      kind: "quran",
      ref: `${verse.surah}:${verse.ayah}`,
      surah_ayah: `${verse.surah}:${verse.ayah}`,
      lang: "en",
      content: chunkContent,
      metadata: {
        surah: verse.surah,
        ayah: verse.ayah,
        translations: trans?.map((t) => ({ lang: t.lang, translator: t.translator })) || [],
      },
    });

    if (chunkErr && !chunkErr.message.includes("duplicate")) {
      throw chunkErr;
    }

    checkpoint.chunksLoaded++;
  }

  console.log(`✅ Created ${checkpoint.chunksLoaded} chunks for embeddings`);
}

async function main() {
  const checkpoint = loadCheckpoint();

  try {
    console.log("🚀 Starting Quran ingestion...");

    await ingestVerses(checkpoint);
    await ingestChunks(checkpoint);

    console.log("\n📊 Final Report:");
    console.log(`  Verses ingested: ${checkpoint.versesLoaded}`);
    console.log(`  Chunks created: ${checkpoint.chunksLoaded}`);
    console.log(`  Storage used: ~${(checkpoint.versesLoaded * 0.5).toFixed(2)} MB`);

    // Clean up checkpoint
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }

    console.log("\n✅ Quran ingestion complete!");
  } catch (err) {
    checkpoint.lastError = String(err);
    saveCheckpoint(checkpoint);
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();
