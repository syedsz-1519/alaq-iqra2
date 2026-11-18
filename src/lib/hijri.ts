// Hijri dates come from the device's built-in Umm al-Qura calendar (Intl). Local moon
// sighting can differ by a day or two, so readers can shift the date in settings.

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Ula",
  "Jumada al-Akhirah",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
] as const;

export type HijriDate = { day: number; month: number; year: number; monthName: string };

const fmt = typeof Intl !== "undefined"
  ? new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" })
  : null;

const startOfDayUTC = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));

/** Hijri date for the device's calendar day of `date`, shifted by `offsetDays`. */
export function toHijri(date: Date, offsetDays = 0): HijriDate {
  const d = new Date(startOfDayUTC(date).getTime() + offsetDays * 86_400_000);
  const parts = fmt!.formatToParts(d);
  const num = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, "") ?? 0);
  const month = num("month");
  return { day: num("day"), month, year: num("year"), monthName: HIJRI_MONTHS[month - 1] ?? "" };
}

export const hijriLabel = (h: HijriDate) => `${h.day} ${h.monthName} ${h.year} AH`;

/** Every Gregorian day of the Hijri month that contains `date`, in order. */
export function hijriMonthDays(date: Date, offsetDays = 0): { date: Date; hijri: HijriDate }[] {
  const today = toHijri(date, offsetDays);
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const start = new Date(base.getTime() - (today.day - 1) * 86_400_000);
  const days: { date: Date; hijri: HijriDate }[] = [];
  for (let i = 0; i < 31; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    const h = toHijri(d, offsetDays);
    if (h.month !== today.month) break;
    days.push({ date: d, hijri: h });
  }
  return days;
}

/** Well-known days of the Islamic year, keyed by "month-day". */
export const ISLAMIC_DAYS: { month: number; day: number; title: string; note: string }[] = [
  { month: 1, day: 1, title: "Islamic New Year", note: "1 Muharram" },
  { month: 1, day: 10, title: "Day of Ashura", note: "Sunnah to fast the 9th and 10th of Muharram" },
  { month: 9, day: 1, title: "Ramadan begins", note: "The month of fasting" },
  { month: 9, day: 21, title: "Last ten nights", note: "Seek Laylat al-Qadr in the odd nights" },
  { month: 9, day: 27, title: "27th night of Ramadan", note: "Many seek Laylat al-Qadr tonight" },
  { month: 10, day: 1, title: "Eid al-Fitr", note: "1 Shawwal" },
  { month: 12, day: 8, title: "Days of Hajj begin", note: "8 Dhu al-Hijjah" },
  { month: 12, day: 9, title: "Day of Arafah", note: "Sunnah to fast for those not on Hajj" },
  { month: 12, day: 10, title: "Eid al-Adha", note: "10 Dhu al-Hijjah" },
];

export const eventOn = (h: HijriDate) => ISLAMIC_DAYS.find((e) => e.month === h.month && e.day === h.day) ?? null;

/** The White Days (13–15) — Sunnah fasting days of every month except Dhu al-Hijjah 13. */
export const isWhiteDay = (h: HijriDate) => h.day >= 13 && h.day <= 15 && !(h.month === 12 && h.day === 13);

/** Next well-known day on or after `date` (looks up to a year ahead). */
export function nextIslamicDay(date: Date, offsetDays = 0) {
  for (let i = 0; i < 400; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, 12);
    const h = toHijri(d, offsetDays);
    const e = eventOn(h);
    if (e) return { ...e, date: d, inDays: i, hijri: h };
  }
  return null;
}

/** Days until 1 Ramadan (0 while Ramadan is under way, with the current day of Ramadan). */
export function ramadanStatus(date: Date, offsetDays = 0) {
  const h = toHijri(date, offsetDays);
  if (h.month === 9) return { inRamadan: true as const, day: h.day, year: h.year };
  for (let i = 1; i < 400; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, 12);
    const x = toHijri(d, offsetDays);
    if (x.month === 9 && x.day === 1) return { inRamadan: false as const, inDays: i, starts: d, year: x.year };
  }
  return null;
}
