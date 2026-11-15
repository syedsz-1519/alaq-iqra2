import { createServerFn } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type HadithTranslation = Database["public"]["Tables"]["hadith_translations"]["Insert"];

/**
 * Get hadith by collection and number
 */
export const getHadith = createServerFn({
  method: "GET",
})
  .inputType<{ collection: string; number: number; language: string }>()
  .handler(async ({ collection, number, language }) => {
    const { data, error } = await supabaseAdmin
      .from("hadith_translations")
      .select("*")
      .eq("collection", collection)
      .eq("hadith_number", number)
      .eq("lang", language)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[Database] Hadith fetch error:", error);
      throw new Error(error.message || "Failed to fetch hadith");
    }

    return data || null;
  });

/**
 * Search hadith by text
 */
export const searchHadith = createServerFn({
  method: "GET",
})
  .inputType<{ query: string; collection?: string; language?: string; limit?: number }>()
  .handler(async ({ query, collection, language, limit = 20 }) => {
    if (!query || query.length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }

    let dbQuery = supabaseAdmin
      .from("hadith_translations")
      .select("*")
      .ilike("text", `%${query}%`)
      .limit(limit);

    if (collection) {
      dbQuery = dbQuery.eq("collection", collection);
    }

    if (language) {
      dbQuery = dbQuery.eq("lang", language);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[Database] Hadith search error:", error);
      throw new Error(error.message || "Failed to search hadith");
    }

    return data || [];
  });

/**
 * Get hadith by collection and section/range
 */
export const getHadithByCollection = createServerFn({
  method: "GET",
})
  .inputType<{ collection: string; language: string; limit?: number; offset?: number }>()
  .handler(async ({ collection, language, limit = 50, offset = 0 }) => {
    const { data, error, count } = await supabaseAdmin
      .from("hadith_translations")
      .select("*", { count: "exact" })
      .eq("collection", collection)
      .eq("lang", language)
      .order("hadith_number", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Database] Collection fetch error:", error);
      throw new Error(error.message || "Failed to fetch collection");
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  });

/**
 * Add or update hadith translation (admin)
 */
export const upsertHadith = createServerFn({
  method: "POST",
})
  .inputType<HadithTranslation>()
  .handler(async (hadith) => {
    // Verify all required fields
    if (
      !hadith.collection ||
      !hadith.hadith_number ||
      !hadith.lang ||
      !hadith.text
    ) {
      throw new Error("Missing required hadith fields");
    }

    const { data, error } = await supabaseAdmin
      .from("hadith_translations")
      .upsert([hadith], {
        onConflict: "collection,hadith_number,lang",
      })
      .select()
      .single();

    if (error) {
      console.error("[Database] Hadith upsert error:", error);
      throw new Error(error.message || "Failed to save hadith");
    }

    return data;
  });

/**
 * Bulk insert hadith (admin)
 */
export const bulkInsertHadith = createServerFn({
  method: "POST",
})
  .inputType<HadithTranslation[]>()
  .handler(async (hadith_list) => {
    if (!hadith_list || hadith_list.length === 0) {
      throw new Error("No hadith provided");
    }

    if (hadith_list.length > 1000) {
      throw new Error("Bulk insert limited to 1000 items at a time");
    }

    // Validate all entries
    for (const h of hadith_list) {
      if (!h.collection || !h.hadith_number || !h.lang || !h.text) {
        throw new Error("Invalid hadith entry - missing required fields");
      }
    }

    const { error, count } = await supabaseAdmin
      .from("hadith_translations")
      .upsert(hadith_list, {
        onConflict: "collection,hadith_number,lang",
      });

    if (error) {
      console.error("[Database] Bulk insert error:", error);
      throw new Error(error.message || "Failed to bulk insert hadith");
    }

    return { success: true, count: count || hadith_list.length };
  });

/**
 * Get all available hadith collections
 */
export const getAvailableCollections = createServerFn({
  method: "GET",
}).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("hadith_translations")
    .select("collection")
    .distinct();

  if (error) {
    console.error("[Database] Collections fetch error:", error);
    throw new Error(error.message || "Failed to fetch collections");
  }

  // Extract unique collections
  const collections = [...new Set((data || []).map((d: any) => d.collection))]
    .filter(Boolean)
    .sort();

  return collections;
});

/**
 * Get available languages for a collection
 */
export const getAvailableLanguages = createServerFn({
  method: "GET",
})
  .inputType<{ collection: string }>()
  .handler(async ({ collection }) => {
    const { data, error } = await supabaseAdmin
      .from("hadith_translations")
      .select("lang")
      .eq("collection", collection)
      .distinct();

    if (error) {
      console.error("[Database] Languages fetch error:", error);
      throw new Error(error.message || "Failed to fetch languages");
    }

    // Extract unique languages
    const languages = [...new Set((data || []).map((d: any) => d.lang))]
      .filter(Boolean)
      .sort();

    return languages;
  });

/**
 * Get hadith translation statistics
 */
export const getHadithStats = createServerFn({
  method: "GET",
}).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("hadith_translations")
    .select("collection,lang", { count: "exact" });

  if (error) {
    console.error("[Database] Stats fetch error:", error);
    throw new Error(error.message || "Failed to fetch stats");
  }

  // Group by collection and language
  const stats: Record<string, Record<string, number>> = {};

  (data || []).forEach((row: any) => {
    if (!stats[row.collection]) {
      stats[row.collection] = {};
    }
    stats[row.collection][row.lang] = (stats[row.collection][row.lang] || 0) + 1;
  });

  return stats;
});
