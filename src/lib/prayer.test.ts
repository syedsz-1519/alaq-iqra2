import { describe, expect, it } from "vitest";
import { dayTimes, nextPrayer, prayersJustStarted, withDefaults, PRAYERS } from "./prayer";

// Kolkata
const LAT = 22.5726;
const LNG = 88.3639;
const day = new Date(Date.UTC(2026, 10, 18, 6, 0)); // 18 Nov 2026, 11:30 in India

describe("prayer times", () => {
  it("puts the five prayers in order through the day", () => {
    const t = dayTimes(day, LAT, LNG, "karachi", "hanafi");
    const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((d) => d.getTime());
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("makes Hanafi Asr later than the Shafi'i Asr", () => {
    const h = dayTimes(day, LAT, LNG, "karachi", "hanafi").asr.getTime();
    const s = dayTimes(day, LAT, LNG, "karachi", "shafi").asr.getTime();
    expect(h - s).toBeGreaterThan(30 * 60_000);
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const t = dayTimes(day, LAT, LNG, "karachi", "hanafi");
    const late = new Date(t.isha.getTime() + 60_000);
    const n = nextPrayer(late, LAT, LNG, "karachi", "hanafi");
    expect(n.name).toBe("fajr");
    expect(n.time.getTime()).toBeGreaterThan(late.getTime());
  });

  it("reports a prayer as just started for the first few minutes only", () => {
    const t = dayTimes(day, LAT, LNG, "karachi", "hanafi");
    const at = new Date(t.dhuhr.getTime() + 60_000);
    expect(prayersJustStarted(at, LAT, LNG, "karachi", "hanafi").map((p) => p.name)).toEqual(["dhuhr"]);
    const later = new Date(t.dhuhr.getTime() + 10 * 60_000);
    expect(prayersJustStarted(later, LAT, LNG, "karachi", "hanafi")).toEqual([]);
  });

  it("starts with the Hanafi Asr and every Adhan switched on", () => {
    const s = withDefaults(null);
    expect(s.asr).toBe("hanafi");
    expect(PRAYERS.every((p) => s.adhan.prayers[p])).toBe(true);
    expect(s.notify).toBe(false);
  });
});
