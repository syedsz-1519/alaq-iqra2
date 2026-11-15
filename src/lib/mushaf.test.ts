import { describe, expect, it } from "vitest";
import { AYAHS_PER_PAGE, paginate } from "./mushaf";

const v = (n: number, len = 40) => ({ numberInSurah: n, arabic: "ا".repeat(len) });
const range = (count: number) => Array.from({ length: count }, (_, i) => v(i + 1, 20 + (i % 9) * 60));

describe("mushaf pages", () => {
  it("puts 10 ayahs on every page", () => {
    expect(AYAHS_PER_PAGE).toBe(10);
    const pages = paginate(range(286));
    expect(pages).toHaveLength(29);
    expect(pages.slice(0, -1).every((p) => p.length === 10)).toBe(true);
    expect(pages[1]?.map((x) => x.numberInSurah)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("puts the leftover ayahs on the last page", () => {
    const pages = paginate(range(286));
    expect(pages.at(-1)?.map((x) => x.numberInSurah)).toEqual([281, 282, 283, 284, 285, 286]);
  });

  it("keeps every ayah exactly once and in order", () => {
    const verses = range(77);
    expect(paginate(verses).flat().map((x) => x.numberInSurah)).toEqual(verses.map((x) => x.numberInSurah));
  });

  it("keeps a short surah on one page", () => {
    expect(paginate(range(7))).toHaveLength(1);
    expect(paginate(range(10))).toHaveLength(1);
    expect(paginate(range(11))).toHaveLength(2);
  });
});
