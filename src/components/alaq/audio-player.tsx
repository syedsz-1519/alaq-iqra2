import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  audioUrl,
  getReciter,
  reciterName as reciterLabel,
  normalizeSettings,
  reciterForSurah,
  surahListQuery,
  translationAudioUrl,
  type Settings,
  type VoiceLang,
} from "@/lib/quran";
import { playableUrl } from "@/lib/offline-cache";
import { speakTranslation } from "@/lib/ai.functions";

/** AI-voiced translations (Telugu, Marathi) generated this session, so replays are instant. */
const ttsCache = new Map<string, Blob>();
function base64ToBlob(b64: string, mime: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: mime });
}

export type AudioAyah = { numberInSurah: number; audio: string };

const buildAyahs = (reciter: string, surah: number, count: number): AudioAyah[] =>
  Array.from({ length: count }, (_, i) => ({ numberInSurah: i + 1, audio: audioUrl(reciter, surah, i + 1) }));
import { KEYS, readStored, useStored, writeStored } from "@/lib/storage";

export type SavedPlayback = {
  surah: number;
  ayah: number;
  englishName: string;
  name: string;
  total: number;
  time: number;
  reciter: string;
  savedAt: number;
};

type PlayerContext = {
  surah: number | null;
  englishName: string;
  name: string;
  ayahs: AudioAyah[];
  index: number;
  playing: boolean;
  loading: boolean;
  progress: number;
  duration: number;
  reciter: string;
  repeatAyah: boolean;
  saved: SavedPlayback | null;
  playSurah: (surah: number, ayah?: number, startTime?: number) => Promise<void>;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  close: () => void;
  /** Change the reciter for the playing surah; `forAll` also makes it the default for every surah. */
  setReciter: (id: string, forAll?: boolean) => void;
  setRepeatAyah: (v: boolean) => void;
  resume: () => void;
  /** Spoken translation played after each Arabic ayah ("none" = Arabic only). */
  voiceTranslation: VoiceLang;
  setVoiceTranslation: (v: VoiceLang) => void;
  /** True while the translation of the current ayah is being spoken. */
  speakingTranslation: boolean;
};

const Ctx = createContext<PlayerContext | null>(null);

export function useAudioPlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAudioPlayer must be used inside AudioPlayerProvider");
  return c;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [settings, setSettings] = useStored<Settings>(KEYS.settings, DEFAULT_SETTINGS);
  const [saved] = useStored<SavedPlayback | null>(KEYS.playback, null);
  const defaultReciter: string = getReciter(settings.reciter ?? DEFAULT_SETTINGS.reciter).id;
  const voiceTranslation = normalizeSettings(settings).voiceTranslation;
  const voiceRef = useRef<VoiceLang>(voiceTranslation);
  voiceRef.current = voiceTranslation;
  const phaseRef = useRef<"arabic" | "translation">("arabic");
  const [speakingTranslation, setSpeakingTranslation] = useState(false);
  const translationRef = useRef<() => Promise<void>>(async () => {});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [surah, setSurah] = useState<number | null>(null);
  const [meta, setMeta] = useState({ englishName: "", name: "" });
  const [ayahs, setAyahs] = useState<AudioAyah[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatAyah, setRepeatAyah] = useState(false);
  const reciter: string = surah ? reciterForSurah(settings, surah) : defaultReciter;

  const stateRef = useRef({ surah, ayahs, index, meta, reciter, repeatAyah });
  stateRef.current = { surah, ayahs, index, meta, reciter, repeatAyah };
  const lastSave = useRef(0);
  const loadToken = useRef(0);
  const resumeRef = useRef<() => void>(() => {});

  const persist = useCallback((time: number) => {
    const s = stateRef.current;
    if (!s.surah || !s.ayahs.length) return;
    writeStored<SavedPlayback>(KEYS.playback, {
      surah: s.surah,
      ayah: s.ayahs[s.index]?.numberInSurah ?? 1,
      englishName: s.meta.englishName,
      name: s.meta.name,
      total: s.ayahs.length,
      time,
      reciter: s.reciter,
      savedAt: Date.now(),
    });
  }, []);

  const loadIndex = useCallback(
    (list: AudioAyah[], i: number, autoplay: boolean, startTime = 0) => {
      const el = audioRef.current;
      if (!el || !list[i]) return;
      phaseRef.current = "arabic";
      setSpeakingTranslation(false);
      setIndex(i);
      setProgress(startTime);
      const token = ++loadToken.current;
      void playableUrl(list[i].audio).then((src) => {
        if (token !== loadToken.current) return;
        if (el.src.startsWith("blob:")) URL.revokeObjectURL(el.src);
        el.src = src;
      const startAt = () => {
        if (startTime > 0) el.currentTime = startTime;
        el.removeEventListener("loadedmetadata", startAt);
      };
        el.addEventListener("loadedmetadata", startAt);
        if (autoplay) {
          el.play().catch(() => setPlaying(false));
        }
      });
    },
    [],
  );

  useEffect(() => {
    const el = new Audio();
    el.preload = "auto";
    audioRef.current = el;
    const onTime = () => {
      setProgress(el.currentTime);
      if (Date.now() - lastSave.current > 2000) {
        lastSave.current = Date.now();
        persist(el.currentTime);
      }
    };
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      persist(el.currentTime);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onEnded = () => {
      const s = stateRef.current;
      if (phaseRef.current === "arabic" && voiceRef.current !== "none") {
        void translationRef.current();
        return;
      }
      if (s.repeatAyah) {
        if (phaseRef.current === "translation") loadIndex(s.ayahs, s.index, true);
        else {
          el.currentTime = 0;
          el.play().catch(() => {});
        }
        return;
      }
      if (s.index < s.ayahs.length - 1) {
        loadIndex(s.ayahs, s.index + 1, true);
      } else {
        setPlaying(false);
        persist(0);
      }
    };
    const onError = () => {
      if (!el.getAttribute("src")) return;
      if (phaseRef.current === "translation") {
        const s = stateRef.current;
        toast.error("The translation audio for this ayah couldn't play.");
        if (s.index < s.ayahs.length - 1) loadIndex(s.ayahs, s.index + 1, true);
        return;
      }
      setLoading(false);
      setPlaying(false);
      toast.error("This recitation couldn't be loaded. Check your connection and try again.");
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("canplay", onPlaying);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.pause();
      el.src = "";
    };
  }, [loadIndex, persist]);

  useEffect(() => {
    if (surah && ayahs[index]) persist(0);
  }, [surah, index, ayahs, persist]);

  const playSurah = useCallback(
    async (n: number, ayah = 1, startTime = 0) => {
      setLoading(true);
      try {
        const list = await qc.ensureQueryData(surahListQuery());
        const info = list.find((x) => x.number === n);
        if (!info) throw new Error("Unknown surah");
        const own = reciterForSurah(readStored<Settings>(KEYS.settings, DEFAULT_SETTINGS), n);
        stateRef.current = { ...stateRef.current, reciter: own };
        const items = buildAyahs(own, n, info.numberOfAyahs);
        const m = { englishName: info.englishName, name: info.name };
        setSurah(n);
        setMeta(m);
        setAyahs(items);
        stateRef.current = { ...stateRef.current, surah: n, ayahs: items, meta: m };
        const i = Math.max(0, Math.min(items.length - 1, ayah - 1));
        loadIndex(items, i, true, startTime);
      } catch {
        setLoading(false);
        toast.error("Couldn't load the recitation. Please check your connection.");
      }
    },
    [qc, loadIndex],
  );

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!el.src) {
      resumeRef.current();
      return;
    }
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  }, [playSurah]);

  const next = useCallback(() => {
    const s = stateRef.current;
    if (s.index < s.ayahs.length - 1) loadIndex(s.ayahs, s.index + 1, true);
  }, [loadIndex]);

  const prev = useCallback(() => {
    const s = stateRef.current;
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    if (s.index > 0) loadIndex(s.ayahs, s.index - 1, true);
  }, [loadIndex]);

  const seek = useCallback((t: number) => {
    const el = audioRef.current;
    if (el) el.currentTime = t;
  }, []);

  const close = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      persist(el.currentTime);
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setSurah(null);
    setAyahs([]);
    setPlaying(false);
    setLoading(false);
  }, [persist]);

  const setReciter = useCallback(
    (id: string, forAll = false) => {
      const cur = stateRef.current.surah;
      setSettings((p) => {
        const base = { ...DEFAULT_SETTINGS, ...p };
        const map = { ...(base.surahReciters ?? {}) };
        if (forAll) return { ...base, reciter: id, surahReciters: {} };
        if (cur) map[String(cur)] = id;
        return cur ? { ...base, surahReciters: map } : { ...base, reciter: id };
      });
      stateRef.current = { ...stateRef.current, reciter: id };
      const s = stateRef.current;
      const el = audioRef.current;
      if (s.surah && s.ayahs.length) {
        const wasPlaying = el ? !el.paused : false;
        const ayah = s.ayahs[s.index]?.numberInSurah ?? 1;
        const items = buildAyahs(id, s.surah, s.ayahs.length);
        setAyahs(items);
        stateRef.current = { ...stateRef.current, ayahs: items };
        loadIndex(items, ayah - 1, wasPlaying);
      }
    },
    [loadIndex, setSettings],
  );

  const resume = useCallback(() => {
    const s = readStored<SavedPlayback | null>(KEYS.playback, null);
    if (!s) return;
    const id = getReciter(s.reciter).id;
    setSettings((p) => {
      const base = { ...DEFAULT_SETTINGS, ...p };
      return { ...base, surahReciters: { ...(base.surahReciters ?? {}), [String(s.surah)]: id } };
    });
    void playSurah(s.surah, s.ayah, s.time);
  }, [playSurah, setSettings]);

  resumeRef.current = resume;

  translationRef.current = async () => {
    const el = audioRef.current;
    const s = stateRef.current;
    const lang = voiceRef.current;
    const ayah = s.ayahs[s.index]?.numberInSurah;
    if (!el || !s.surah || !ayah || lang === "none") return;
    const surahNo = s.surah;
    const token = ++loadToken.current;
    phaseRef.current = "translation";
    setSpeakingTranslation(true);
    setLoading(true);
    try {
      let src: string;
      if (lang === "te" || lang === "mr") {
        const key = `${lang}:${surahNo}:${ayah}`;
        let blob = ttsCache.get(key);
        if (!blob) {
          const res = await speakTranslation({ data: { lang, surah: surahNo, ayah } });
          blob = base64ToBlob(res.audio, res.mime);
          if (ttsCache.size > 60) ttsCache.delete(ttsCache.keys().next().value as string);
          ttsCache.set(key, blob);
        }
        src = URL.createObjectURL(blob);
      } else {
        src = await playableUrl(translationAudioUrl(lang, surahNo, ayah));
      }
      if (token !== loadToken.current) return;
      if (el.src.startsWith("blob:")) URL.revokeObjectURL(el.src);
      el.src = src;
      await el.play();
    } catch (e) {
      if (token !== loadToken.current) return;
      const unauthorized = e instanceof Error && /unauthori[sz]ed|401/i.test(e.message);
      toast.error(
        unauthorized
          ? "Sign in to hear the Telugu and Marathi translations spoken aloud."
          : "The translation audio couldn't play. Continuing with the recitation.",
      );
      if (s.index < s.ayahs.length - 1) loadIndex(s.ayahs, s.index + 1, true);
      else setLoading(false);
    }
  };

  const setVoiceTranslation = useCallback(
    (v: VoiceLang) => setSettings((p) => ({ ...DEFAULT_SETTINGS, ...p, voiceTranslation: v })),
    [setSettings],
  );

  // Lock-screen / headset controls.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !surah) return;
    const ayah = ayahs[index]?.numberInSurah ?? 1;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${meta.englishName} · Ayah ${ayah}`,
      artist: ayahs.length ? reciterLabel(reciter) : "",
      album: "Alaq — The Holy Quran",
      artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [surah, index, ayahs, meta.englishName, reciter, toggle, next, prev]);

  const value = useMemo<PlayerContext>(
    () => ({
      surah,
      englishName: meta.englishName,
      name: meta.name,
      ayahs,
      index,
      playing,
      loading,
      progress,
      duration,
      reciter,
      repeatAyah,
      saved,
      playSurah,
      toggle,
      next,
      prev,
      seek,
      close,
      setReciter,
      setRepeatAyah,
      resume,
      voiceTranslation,
      setVoiceTranslation,
      speakingTranslation,
    }),
    [surah, meta, ayahs, index, playing, loading, progress, duration, reciter, repeatAyah, saved, playSurah, toggle, next, prev, seek, close, setReciter, resume, voiceTranslation, setVoiceTranslation, speakingTranslation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

