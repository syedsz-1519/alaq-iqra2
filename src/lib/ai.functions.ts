import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const speakTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      lang: z.enum(["te", "mr"]),
      surah: z.number().int().min(1).max(114),
      ayah: z.number().int().min(1).max(286),
    }),
  )
  .handler(async ({ data }) => {
    const { speakTranslationServer } = await import("./ai.server");
    return speakTranslationServer(data);
  });

export const checkRecitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      assignmentId: z.string().min(1).max(40),
      audio: z.string().min(100).max(12_000_000),
      mime: z.string().max(60),
      feedbackLang: z.enum(["en", "hi", "ur", "roman", "te", "mr"]),
      teacher: z.enum(["zaid", "zara"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { checkRecitationServer } = await import("./ai.server");
    return checkRecitationServer(data);
  });
