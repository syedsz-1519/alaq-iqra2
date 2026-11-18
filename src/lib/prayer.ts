// Prayer times are calculated on the device (and on the server for closed-app alerts)
// with the open-source `adhan` library — no network needed once the location is known.
import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];
export const PRAYER_LABEL: Record<PrayerName | "sunrise", string> = {
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};
export const PRAYER_ARABIC: Record<PrayerName | "sunrise", string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const METHODS = {
  karachi: { label: "University of Islamic Sciences, Karachi", region: "India, Pakistan, Bangladesh", make: CalculationMethod.Karachi },
  mwl: { label: "Muslim World League", region: "Europe, Far East", make: CalculationMethod.MuslimWorldLeague },
  isna: { label: "ISNA (North America)", region: "USA, Canada", make: CalculationMethod.NorthAmerica },
  egypt: { label: "Egyptian General Authority", region: "Africa, Middle East", make: CalculationMethod.Egyptian },
  ummalqura: { label: "Umm al-Qura, Makkah", region: "Saudi Arabia", make: CalculationMethod.UmmAlQura },
  dubai: { label: "Dubai", region: "UAE", make: CalculationMethod.Dubai },
  qatar: { label: "Qatar", region: "Qatar", make: CalculationMethod.Qatar },
  kuwait: { label: "Kuwait", region: "Kuwait", make: CalculationMethod.Kuwait },
  singapore: { label: "Singapore / Malaysia / Indonesia", region: "South-East Asia", make: CalculationMethod.Singapore },
  turkey: { label: "Diyanet, Turkey", region: "Turkey", make: CalculationMethod.Turkey },
  moonsighting: { label: "Moonsighting Committee", region: "UK and worldwide", make: CalculationMethod.MoonsightingCommittee },
} as const;
export type MethodKey = keyof typeof METHODS;
export type AsrSchool = "hanafi" | "shafi";

export type PrayerLocation = { lat: number; lng: number; label?: string; at: number };

export type PrayerSettings = {
  method: MethodKey;
  asr: AsrSchool;
  location: PrayerLocation | null;
  adhan: {
    /** Play the Adhan in the app at prayer time. */
    enabled: boolean;
    voice: string;
    /** Fajr can use its own voice; null = same as the others. */
    prayers: Record<PrayerName, boolean>;
    volume: number;
  };
  /** Phone notification at prayer time even when Alaq is closed. */
  notify: boolean;
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  method: "karachi",
  asr: "hanafi",
  location: null,
  adhan: {
    enabled: true,
    voice: "makkah",
    prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    volume: 0.9,
  },
  notify: false,
};

/** Fills in anything missing from older saved settings. */
export function withDefaults(s: Partial<PrayerSettings> | null | undefined): PrayerSettings {
  const d = DEFAULT_PRAYER_SETTINGS;
  return {
    method: s?.method && s.method in METHODS ? s.method : d.method,
    asr: s?.asr === "shafi" ? "shafi" : s?.asr === "hanafi" ? "hanafi" : d.asr,
    location: s?.location ?? null,
    adhan: { ...d.adhan, ...s?.adhan, prayers: { ...d.adhan.prayers, ...s?.adhan?.prayers } },
    notify: Boolean(s?.notify),
  };
}

export type DayTimes = Record<PrayerName | "sunrise", Date>;

function params(method: MethodKey, asr: AsrSchool) {
  const p = METHODS[method].make();
  p.madhab = asr === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return p;
}

/** Prayer times for the calendar day of `date` (as seen on this device). */
export function dayTimes(date: Date, lat: number, lng: number, method: MethodKey, asr: AsrSchool): DayTimes {
  const t = new PrayerTimes(new Coordinates(lat, lng), date, params(method, asr));
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha };
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);

/** The next of the five prayers after `now` (rolls over to tomorrow's Fajr after Isha). */
export function nextPrayer(now: Date, lat: number, lng: number, method: MethodKey, asr: AsrSchool) {
  for (const offset of [0, 1]) {
    const times = dayTimes(addDays(now, offset), lat, lng, method, asr);
    const hit = PRAYERS.find((p) => times[p].getTime() > now.getTime());
    if (hit) return { name: hit, time: times[hit] };
  }
  // Polar edge cases: fall back to tomorrow's Fajr.
  const t = dayTimes(addDays(now, 1), lat, lng, method, asr);
  return { name: "fajr" as PrayerName, time: t.fajr };
}

/** The prayer whose time has begun most recently, or null before today's Fajr. */
export function currentPrayer(now: Date, lat: number, lng: number, method: MethodKey, asr: AsrSchool): PrayerName | null {
  const times = dayTimes(now, lat, lng, method, asr);
  let cur: PrayerName | null = null;
  for (const p of PRAYERS) if (times[p].getTime() <= now.getTime()) cur = p;
  return cur;
}

/**
 * Prayers that began within the last `windowMs` (used by the server's minute-by-minute
 * alert job). Checks the neighbouring days too, so it is right in every time zone.
 */
export function prayersJustStarted(now: Date, lat: number, lng: number, method: MethodKey, asr: AsrSchool, windowMs = 3 * 60_000) {
  const out: { name: PrayerName; time: Date }[] = [];
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  for (const off of [-1, 0, 1]) {
    const day = new Date(base.getTime() + off * 86_400_000);
    const t = dayTimes(day, lat, lng, method, asr);
    for (const p of PRAYERS) {
      const diff = now.getTime() - t[p].getTime();
      if (diff >= 0 && diff < windowMs && !out.some((x) => x.time.getTime() === t[p].getTime())) out.push({ name: p, time: t[p] });
    }
  }
  return out;
}

/** Direction of the Kaaba in degrees from true north. */
export const qiblaDegrees = (lat: number, lng: number) => Qibla(new Coordinates(lat, lng));

export function formatTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
}

/** "2h 05m" / "12m" / "45s" until the target. */
export function countdown(ms: number) {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
