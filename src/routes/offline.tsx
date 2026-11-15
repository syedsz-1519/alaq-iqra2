import { shareImage } from "@/lib/share";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CloudDownload, HardDrive, Loader2, Trash2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { CACHE_AUDIO, CACHE_TEXT, removeAll, saveAll, storageEstimate } from "@/lib/offline-cache";
import { DEFAULT_SETTINGS, RECITERS, SURAH_LIST_URL, surahAudioUrls, surahListQuery, surahTextUrl, type Settings } from "@/lib/quran";
import { KEYS, useStored } from "@/lib/storage";
import { useOnline } from "@/hooks/use-online";
import { PageHeader } from "@/components/alaq/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/offline")({
  loader: ({ context }) => context.queryClient.ensureQueryData(surahListQuery()),
  head: ({ match }) => ({
    meta: [
      { title: "Offline Library — Save Quran Text & Recitations | Alaq" },
      { name: "description", content: "Save the full Quran text with translations and your chosen recitations on your device, and see exactly what works without internet." },
      { property: "og:title", content: "Offline Library | Alaq" },
      { property: "og:description", content: "Keep the Quran, translations and recitations on your device." },
      { property: "og:type", content: "website" },
      ...shareImage(match.context.origin),
    ],
  }),
  component: OfflinePage,
});

const mb = (b: number) => (b / 1024 / 1024 < 1 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

function useCacheKeys(name: string) {
  const [keys, setKeys] = useState<Set<string> | null>(null);
  const refresh = useCallback(async () => {
    if (!("caches" in window)) return setKeys(new Set());
    const c = await caches.open(name);
    setKeys(new Set((await c.keys()).map((r) => r.url)));
  }, [name]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { keys, refresh };
}

function OfflinePage() {
  const online = useOnline();
  const { data: surahs } = useSuspenseQuery(surahListQuery());
  const [rawSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const [reciter, setReciter] = useState(rawSettings.reciter ?? DEFAULT_SETTINGS.reciter);
  useEffect(() => setReciter(rawSettings.reciter ?? DEFAULT_SETTINGS.reciter), [rawSettings.reciter]);

  const text = useCacheKeys(CACHE_TEXT);
  const audio = useCacheKeys(CACHE_AUDIO);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [textProgress, setTextProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState<{ label: string; pct: number } | null>(null);

  const refreshAll = useCallback(() => {
    void text.refresh();
    void audio.refresh();
    void storageEstimate().then(setUsage);
  }, [text, audio]);
  useEffect(() => {
    void storageEstimate().then(setUsage);
  }, []);

  const textUrls = useMemo(() => [SURAH_LIST_URL, ...surahs.map((s) => surahTextUrl(s.number))], [surahs]);
  const textSaved = text.keys ? surahs.filter((s) => text.keys!.has(surahTextUrl(s.number))).length : null;

  const audioCount = (n: number, count: number) =>
    audio.keys ? surahAudioUrls(reciter, n, count).filter((u) => audio.keys!.has(u)).length : 0;

  const saveText = async () => {
    setTextProgress(0);
    try {
      await saveAll(textUrls, CACHE_TEXT, (d, t) => setTextProgress(Math.round((d / t) * 100)));
      toast.success("The full Quran text and translations are saved on this device");
    } catch {
      toast.error("Saving stopped. Reconnect and tap again — finished surahs are kept.");
    } finally {
      setTextProgress(null);
      refreshAll();
    }
  };

  const saveAudio = async (list: number[], label: string) => {
    const urls = list.flatMap((n) => surahAudioUrls(reciter, n, surahs[n - 1]?.numberOfAyahs ?? 0));
    setBusy({ label, pct: 0 });
    try {
      await saveAll(urls, CACHE_AUDIO, (d, t) => setBusy({ label, pct: Math.round((d / t) * 100) }));
      toast.success(`${label} saved for offline listening`);
    } catch {
      toast.error("The download stopped. Reconnect and try again — saved ayahs are kept.");
    } finally {
      setBusy(null);
      refreshAll();
    }
  };

  const removeAudio = async (n: number) => {
    await removeAll(surahAudioUrls(reciter, n, surahs[n - 1]?.numberOfAyahs ?? 0), CACHE_AUDIO);
    refreshAll();
  };

  const removeText = async () => {
    await caches.delete(CACHE_TEXT);
    refreshAll();
    toast("Saved Quran text removed");
  };

  const fullySavedSurahs = surahs.filter((s) => audioCount(s.number, s.numberOfAyahs) === s.numberOfAyahs).length;
  const juzAmma = surahs.filter((s) => s.number >= 78).map((s) => s.number);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <PageHeader eyebrow="Offline library" title="Use Alaq without internet">
        Save the Quran and your favourite recitations on this device. Everything saved here keeps working with no
        connection.
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatusCard
          icon={online ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
          title={online ? "You're online" : "You're offline"}
          text={online ? "Downloads are available" : "Showing what's saved"}
        />
        <StatusCard
          icon={<CheckCircle2 className="size-5" />}
          title={textSaved == null ? "Checking…" : `${textSaved} / 114 surahs`}
          text="Text & translations saved"
        />
        <StatusCard
          icon={<HardDrive className="size-5" />}
          title={usage ? mb(usage.usage) : "—"}
          text={usage ? `used on this device (of ${mb(usage.quota)})` : "Storage used"}
        />
      </div>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Quran text & translations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Arabic (Uthmani), English (Saheeh International) and Urdu (Jalandhry). Surahs you open are saved
              automatically; save all 114 at once here (about 6 MB).
            </p>
          </div>
          {textSaved === 114 ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground">
                <CheckCircle2 className="size-4" /> Whole Quran saved
              </span>
              <Button variant="ghost" size="icon" aria-label="Remove saved text" onClick={removeText}>
                <Trash2 />
              </Button>
            </div>
          ) : (
            <Button onClick={saveText} disabled={!online || textProgress != null}>
              {textProgress != null ? <Loader2 className="animate-spin" /> : <CloudDownload />}
              {textProgress != null ? `Saving… ${textProgress}%` : "Save the whole Quran"}
            </Button>
          )}
        </div>
        {textProgress != null && <Progress value={textProgress} className="mt-4" />}
        {textSaved != null && textSaved < 114 && textProgress == null && (
          <Progress value={(textSaved / 114) * 100} className="mt-4" />
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Recitations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a reciter and save the surahs you listen to most. {fullySavedSurahs} surahs fully saved for this
              reciter.
            </p>
          </div>
          <Select value={reciter} onValueChange={setReciter}>
            <SelectTrigger aria-label="Reciter to download" className="w-60 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECITERS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!online || !!busy} onClick={() => saveAudio([1], "Al-Fatihah")}>
            Save Al-Fatihah
          </Button>
          <Button variant="outline" size="sm" disabled={!online || !!busy} onClick={() => saveAudio([18, 36, 67], "Al-Kahf, Ya-Sin & Al-Mulk")}>
            Save Al-Kahf, Ya-Sin & Al-Mulk
          </Button>
          <Button variant="outline" size="sm" disabled={!online || !!busy} onClick={() => saveAudio(juzAmma, "Juz 'Amma")}>
            Save Juz 'Amma (≈60 MB)
          </Button>
        </div>

        {busy && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">
              Saving {busy.label}… {busy.pct}%
            </p>
            <Progress value={busy.pct} />
          </div>
        )}

        <ul className="mt-5 divide-y divide-border">
          {surahs.map((s) => {
            const have = audioCount(s.number, s.numberOfAyahs);
            const complete = have === s.numberOfAyahs;
            return (
              <li key={s.number} className="flex items-center gap-3 py-2.5">
                <span className="w-7 text-sm font-semibold text-gold">{s.number}</span>
                <Link to="/quran/$surah" params={{ surah: String(s.number) }} search={{}} className="flex-1 truncate font-medium">
                  {s.englishName}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{s.numberOfAyahs} ayahs</span>
                </Link>
                {complete ? (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      <CheckCircle2 className="size-3.5" /> Saved
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${s.englishName} recitation`}
                      onClick={() => removeAudio(s.number)}
                      className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!online || !!busy}
                    onClick={() => saveAudio([s.number], s.englishName)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                  >
                    <CloudDownload className="size-3.5" />
                    {have > 0 ? `${have}/${s.numberOfAyahs}` : "Save"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Duas & Dhikr</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All 132 Hisnul Muslim chapters and the tasbih counter are built into the app and always available offline.
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Hadith</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every hadith book you open is kept on this device, so you can return to it without a connection.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-secondary/60 p-6">
        <h2 className="font-display text-lg font-semibold">Install Alaq on your phone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          On iPhone, open Alaq in Safari, tap Share, then “Add to Home Screen”. On Android, open the browser menu and
          tap “Install app”. Once installed, Alaq opens from your home screen even without internet.
        </p>
      </section>
    </div>
  );
}

function StatusCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
