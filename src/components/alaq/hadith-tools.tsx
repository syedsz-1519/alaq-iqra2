import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Headphones, Loader2, Pause, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { speakHadith, translateHadith } from "@/lib/hadith-ai.functions";
import { HADITH_LANGS, type HadithLang } from "@/lib/hadith";
import { cn } from "@/lib/utils";

type AiLang = "roman" | "te" | "mr";
export const isAiLang = (l: HadithLang): l is AiLang => l === "roman" || l === "te" || l === "mr";

/** Saved AI translations for a range of hadith (public read). */
export function useSavedTranslations(collection: string, lang: HadithLang, first: number, last: number) {
  return useQuery({
    queryKey: ["hadith-ai", collection, lang, first, last],
    enabled: isAiLang(lang),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hadith_translations")
        .select("hadith_number, text")
        .eq("collection", collection)
        .eq("lang", lang)
        .gte("hadith_number", first)
        .lte("hadith_number", last);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.hadith_number, r.text])) as Record<number, string>;
    },
  });
}

export function LangBar({ value, onChange, urdu }: { value: HadithLang; onChange: (l: HadithLang) => void; urdu: boolean }) {
  return (
    <div role="radiogroup" aria-label="Translation language" className="flex flex-wrap gap-1.5">
      {HADITH_LANGS.map((l) => {
        const disabled = l.id === "ur" && !urdu;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={value === l.id}
            disabled={disabled}
            title={disabled ? "No published Urdu edition for this collection" : l.ai ? "AI translation of the published English" : undefined}
            onClick={() => onChange(l.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              value === l.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
            )}
          >
            {l.native}
            {l.ai && <Sparkles className="ml-1 inline size-3 opacity-70" aria-label="AI" />}
          </button>
        );
      })}
    </div>
  );
}

/** "Translate with AI" for one hadith (signed-in), cached for everyone afterwards. */
export function TranslateButton({ collection, number, lang, first, last }: { collection: string; number: number; lang: AiLang; first: number; last: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const name = HADITH_LANGS.find((l) => l.id === lang)?.label ?? lang;
  if (!user)
    return (
      <Link to="/auth" search={{ redirect: typeof window === "undefined" ? "/hadith" : window.location.pathname }} className="text-sm text-primary underline underline-offset-2">
        Sign in to translate into {name}
      </Link>
    );
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await translateHadith({ data: { collection, number, lang } });
          qc.setQueryData<Record<number, string>>(["hadith-ai", collection, lang, first, last], (old) => ({ ...(old ?? {}), [number]: r.text }));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Couldn't translate");
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Translate into {name}
    </button>
  );
}

const audioCache = new Map<string, string>();
let current: HTMLAudioElement | null = null;

function toUrl(b64: string, mime: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/** Reads one hadith aloud in Arabic or the chosen language. */
export function ListenButton({ collection, number, lang, label }: { collection: string; number: number; lang: "ar" | HadithLang; label: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const el = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => el.current?.pause(), []);

  const play = async () => {
    if (state === "playing") {
      el.current?.pause();
      setState("idle");
      return;
    }
    if (!user) {
      toast("Sign in to listen to hadith read aloud.");
      return;
    }
    const key = `${collection}:${number}:${lang}`;
    setState("loading");
    try {
      let url = audioCache.get(key);
      if (!url) {
        const r = await speakHadith({ data: { collection, number, lang } });
        url = toUrl(r.audio, r.mime);
        audioCache.set(key, url);
      }
      current?.pause();
      const a = new Audio(url);
      el.current = a;
      current = a;
      a.onended = () => setState("idle");
      a.onpause = () => setState("idle");
      await a.play();
      setState("playing");
    } catch (e) {
      setState("idle");
      toast.error(e instanceof Error ? e.message : "Couldn't play this hadith");
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={state === "playing" ? `Stop ${label}` : `Listen in ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/70"
    >
      {state === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : state === "playing" ? <Pause className="size-3.5" /> : <Headphones className="size-3.5" />}
      {label}
    </button>
  );
}
