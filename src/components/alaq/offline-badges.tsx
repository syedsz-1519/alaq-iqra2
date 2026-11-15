import { useEffect, useState } from "react";
import { CheckCircle2, CloudDownload, Loader2, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { CACHE_AUDIO, CACHE_TEXT, countCached, isCached, removeAll, saveAll } from "@/lib/offline-cache";
import { reciterName, surahAudioUrls } from "@/lib/quran";
import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/utils";

export function OfflineIndicator({ className }: { className?: string }) {
  const online = useOnline();
  if (online) return null;
  return (
    <div className={cn("flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-foreground", className)}>
      <WifiOff className="size-3.5" /> You're offline — saved surahs, duas and recitations still work
    </div>
  );
}

/** Makes sure the given text file is stored on the device and reports its status. */
export function useTextSaved(url: string, ensure = true) {
  const [saved, setSaved] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!("caches" in window)) return setSaved(false);
      let ok = await isCached(url, CACHE_TEXT);
      if (!ok && ensure && navigator.onLine) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            await (await caches.open(CACHE_TEXT)).put(url, res);
            ok = true;
          }
        } catch {
          /* offline */
        }
      }
      if (alive) setSaved(ok);
    })();
    return () => {
      alive = false;
    };
  }, [url, ensure]);
  return saved;
}

export function TextSavedBadge({ url }: { url: string }) {
  const saved = useTextSaved(url);
  if (saved == null) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        saved ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      {saved ? <CheckCircle2 className="size-3.5" /> : <WifiOff className="size-3.5" />}
      {saved ? "Text saved offline" : "Text not saved yet"}
    </span>
  );
}

export function useAudioSaved(reciter: string, surah: number, count: number) {
  const [saved, setSaved] = useState<number | null>(null);
  const urls = surahAudioUrls(reciter, surah, count);
  const key = urls[0];
  const refresh = () => countCached(urls, CACHE_AUDIO).then(setSaved);
  useEffect(() => {
    setSaved(null);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, count]);
  return { saved, urls, refresh };
}

export function RecitationDownload({
  reciter,
  surah,
  count,
  compact,
}: {
  reciter: string;
  surah: number;
  count: number;
  compact?: boolean;
}) {
  const { saved, urls, refresh } = useAudioSaved(reciter, surah, count);
  const [progress, setProgress] = useState<number | null>(null);
  const online = useOnline();
  const complete = saved === count;

  const download = async () => {
    setProgress(0);
    try {
      await saveAll(urls, CACHE_AUDIO, (d, t) => setProgress(Math.round((d / t) * 100)));
      toast.success(`Saved ${reciterName(reciter)}'s recitation for offline listening`);
    } catch {
      toast.error("The download stopped. Check your connection and try again — saved ayahs are kept.");
    } finally {
      setProgress(null);
      void refresh();
    }
  };

  const remove = async () => {
    await removeAll(urls, CACHE_AUDIO);
    void refresh();
    toast("Removed the saved recitation");
  };

  if (saved == null) return null;

  if (progress != null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
        <Loader2 className="size-3.5 animate-spin" /> Saving audio… {progress}%
      </span>
    );
  }

  if (complete) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          <CheckCircle2 className="size-3.5" /> {compact ? "Audio saved" : "Recitation saved offline"}
        </span>
        <button
          type="button"
          onClick={remove}
          aria-label="Remove saved recitation"
          title="Remove saved recitation"
          className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={!online}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50"
    >
      <CloudDownload className="size-3.5" />
      {saved > 0 ? `Finish saving audio (${saved}/${count})` : compact ? "Save audio" : "Save recitation offline"}
    </button>
  );
}
