import { useCallback, useEffect, useRef, useState } from "react";
import { pickVoice, type SpeechPart } from "@/lib/device-voice";

/** Plays a list of parts one after another with the phone's built-in voice. Works offline. */
export function useDeviceSpeech(gender: "male" | "female") {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(0.95);
  const run = useRef(0);
  const partsRef = useRef<SpeechPart[]>([]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakFrom = useCallback(
    (i: number, id: number, r: number) => {
      const parts = partsRef.current;
      if (id !== run.current) return;
      if (i >= parts.length) {
        setIndex(-1);
        return;
      }
      const part = parts[i]!;
      const voice = pickVoice(voices, part.lang, gender);
      // No Arabic voice on this phone: skip the letters (they're shown on screen).
      if (part.lang === "ar" && !voice) return speakFrom(i + 1, id, r);
      const u = new SpeechSynthesisUtterance(part.text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? (part.lang === "ar" ? "ar-SA" : "en-IN");
      u.rate = part.lang === "ar" ? Math.min(r, 0.8) : r;
      u.pitch = gender === "male" ? 0.92 : 1.05;
      u.onend = () => speakFrom(i + 1, id, r);
      u.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") speakFrom(i + 1, id, r);
      };
      setIndex(i);
      window.speechSynthesis.speak(u);
    },
    [voices, gender],
  );

  const play = useCallback(
    (parts: SpeechPart[], from = 0) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      partsRef.current = parts;
      run.current += 1;
      setPaused(false);
      speakFrom(from, run.current, rate);
    },
    [supported, speakFrom, rate],
  );

  const stop = useCallback(() => {
    run.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setIndex(-1);
    setPaused(false);
  }, [supported]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setPaused(true);
  }, []);
  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setPaused(false);
  }, []);

  /** Changing speed restarts the current sentence at the new pace. */
  const changeRate = useCallback(
    (r: number) => {
      setRate(r);
      if (index >= 0) {
        window.speechSynthesis.cancel();
        run.current += 1;
        setPaused(false);
        speakFrom(index, run.current, r);
      }
    },
    [index, speakFrom],
  );

  const hasLocalVoice = voices.some((v) => v.localService && v.lang.toLowerCase().startsWith("en"));
  return { supported, playing: index >= 0, paused, index, rate, play, stop, pause, resume, changeRate, hasLocalVoice, voicesLoaded: voices.length > 0 };
}
