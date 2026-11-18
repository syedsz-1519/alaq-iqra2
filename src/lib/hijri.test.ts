import { describe, expect, it } from "vitest";
import { hijriMonthDays, ramadanStatus, toHijri } from "./hijri";

describe("hijri calendar", () => {
  it("reads the Umm al-Qura date and lets readers shift it", () => {
    const d = new Date(2026, 1, 18, 12); // 18 Feb 2026 = 1 Ramadan 1447 (Umm al-Qura)
    expect(toHijri(d)).toMatchObject({ day: 1, month: 9, year: 1447, monthName: "Ramadan" });
    expect(toHijri(d, -1)).toMatchObject({ month: 8 });
  });

  it("lists every day of the month starting on day 1", () => {
    const days = hijriMonthDays(new Date(2026, 1, 25, 12));
    expect(days[0]?.hijri.day).toBe(1);
    expect(days.length === 29 || days.length === 30).toBe(true);
    expect(days.every((x, i) => x.hijri.day === i + 1)).toBe(true);
  });

  it("counts down to Ramadan, and counts its days during it", () => {
    const before = ramadanStatus(new Date(2026, 1, 15, 12));
    expect(before).toMatchObject({ inRamadan: false, inDays: 3 });
    expect(ramadanStatus(new Date(2026, 1, 20, 12))).toMatchObject({ inRamadan: true, day: 3 });
  });
});
