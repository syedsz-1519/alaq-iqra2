import { describe, expect, it } from "vitest";
import { AYAHS_PER_PAGE, paginate } from "./mushaf";

const v = (n: number, len = 40) => ({ numberInSurah: n, arabic: "ا".repeat(len) });
const range = (count: number) => Array.from({ length: count }, (_, i) => v(i + 1, 20 + (i % 9) * 60));

describe("mushaf pages", () => {
  it("puts 15 ayahs on every page", () => {
    expect(AYAHS_PER_PAGE).toBe(15);
    const pages = paginate(range(286));
    expect(pages).toHaveLength(20);
    expect(pages.slice(0, -1).every((p) => p.length === 15)).toBe(true);
    expect(pages[1]?.map((x) => x.numberInSurah)).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
  });

  it("puts the leftover ayahs on the last page", () => {
    const pages = paginate(range(286));
    expect(pages.at(-1)?.map((x) => x.numberInSurah)).toEqual([286]);
  });

  it("keeps every ayah exactly once and in order", () => {
    const verses = range(77);
    expect(paginate(verses).flat().map((x) => x.numberInSurah)).toEqual(verses.map((x) => x.numberInSurah));
  });

  it("keeps a short surah on one page", () => {
    expect(paginate(range(7))).toHaveLength(1);
    expect(paginate(range(15))).toHaveLength(1);
    expect(paginate(range(16))).toHaveLength(2);
  });
});

describe("page lookup", () => {
  it("finds the page for an ayah and the ayahs on a page", async () => {
    const { pageOfAyah, pageCount, pageRange } = await import("./mushaf");
    expect(pageOfAyah(1)).toBe(0);
    expect(pageOfAyah(15)).toBe(0);
    expect(pageOfAyah(16)).toBe(1);
    expect(pageCount(286)).toBe(20);
    expect(pageCount(7)).toBe(1);
    expect(pageRange(19, 286)).toEqual({ from: 286, to: 286 });
  });
});
