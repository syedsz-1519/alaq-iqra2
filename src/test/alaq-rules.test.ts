import { describe, expect, it } from "vitest";
import { incrementDhikr, EMPTY_DHIKR } from "@/lib/dhikr";
import { toggleBookmark } from "@/lib/reading";
import { RECITERS, audioUrl, normalizeSettings, reciterForSurah, splitBismillah } from "@/lib/quran";
import { getLesson, lessonsFor } from "@/lib/zaid-lessons";
import { TEACHERS, getTeacher } from "@/lib/teachers";

describe("dhikr counter", () => {
  it("resets today's total on a new day but keeps the lifetime count", () => {
    const day1 = incrementDhikr(EMPTY_DHIKR, "subhanallah", new Date(2026, 10, 14, 9));
    const again = incrementDhikr(day1, "subhanallah", new Date(2026, 10, 14, 20));
    const day2 = incrementDhikr(again, "subhanallah", new Date(2026, 10, 15, 6));
    expect(again.todayTotal).toBe(2);
    expect(day2.todayTotal).toBe(1);
    expect(day2.lifetime).toBe(3);
    expect(day2.counts["subhanallah"]).toBe(3);
  });
});

describe("bookmarks", () => {
  it("adds an ayah once and removes it on the second tap", () => {
    const b = { surah: 2, ayah: 255, englishName: "Al-Baqara", preview: "Allah" };
    const added = toggleBookmark([], b, 1);
    expect(added).toHaveLength(1);
    expect(toggleBookmark(added, b, 2)).toHaveLength(0);
  });
});

describe("quran text and audio", () => {
  it("moves the Basmalah out of ayah 1 except for Al-Fatihah and At-Tawbah", () => {
    const text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ";
    expect(splitBismillah(112, text)).toEqual({ bismillah: true, text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" });
    expect(splitBismillah(1, text).bismillah).toBe(false);
  });

  it("builds the per-ayah recitation address", () => {
    expect(audioUrl("husary", 2, 255)).toBe("https://everyayah.com/data/Husary_128kbps/002255.mp3");
  });

  it("does not offer Mishary Rashid Alafasy as a reciter", () => {
    expect(RECITERS.some((r) => r.id === ("alafasy" as string) || r.name.includes("Alafasy"))).toBe(false);
  });

  it("moves an old saved Alafasy choice to the default reciter", () => {
    expect(normalizeSettings({ reciter: "alafasy", arabicSize: 32 }).reciter).toBe("husary");
    expect(reciterForSurah({ reciter: "sudais", surahReciters: { "36": "alafasy" }, arabicSize: 32 }, 36)).toBe("husary");
  });
});

describe("voice teachers", () => {
  it("offers Zaid with a male voice and Zara with a female voice", () => {
    expect(TEACHERS.zaid.voice).toBe("meridian");
    expect(TEACHERS.zara.voice).toBe("gleam");
  });

  it("falls back to Zaid for an unknown teacher", () => {
    expect(getTeacher("someone-else").id).toBe("zaid");
  });
});

describe("lessons", () => {
  it("has Tajweed, Arabic and Fiqh lessons and rejects unknown lesson ids", () => {
    expect(lessonsFor("tajweed").length).toBeGreaterThan(5);
    expect(lessonsFor("arabic").length).toBeGreaterThan(5);
    expect(lessonsFor("fiqh").length).toBeGreaterThan(5);
    expect(getLesson("not-a-lesson")).toBeUndefined();
    expect(getLesson("fiqh-wudu")?.topic).toBe("fiqh");
  });
});
