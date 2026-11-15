import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const base = { collection: z.string().regex(/^[a-z]{3,12}$/), number: z.number().int().min(1).max(8000) };

export const translateHadith = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ...base, lang: z.enum(["roman", "te", "mr"]) }))
  .handler(async ({ data }) => {
    const { translateHadithServer } = await import("./hadith-ai.server");
    return translateHadithServer(data);
  });

export const speakHadith = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ...base, lang: z.enum(["ar", "en", "ur", "roman", "te", "mr"]) }))
  .handler(async ({ data }) => {
    const { speakHadithServer } = await import("./hadith-ai.server");
    return speakHadithServer(data);
  });
