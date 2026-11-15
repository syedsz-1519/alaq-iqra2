import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const checkPhrase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      surah: z.number().int().min(1).max(114),
      ayah: z.number().int().min(1).max(286),
      phrase: z.number().int().min(0).max(60),
      audio: z.string().min(100).max(4_000_000),
      mime: z.string().max(60),
    }),
  )
  .handler(async ({ data }) => {
    const { checkPhraseServer } = await import("./phrase.server");
    return checkPhraseServer(data);
  });
