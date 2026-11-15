import { describe, expect, it } from "vitest";
import { pageBudget, paginate } from "./mushaf";

const v = (n: number, len: number, tlen = 0) => ({ numberInSurah: n, arabic: "ا".repeat(len), translation: "e".repeat(tlen) });

describe("mushaf pages", () => {
  it("keeps every ayah exactly once and in order", () => {
    const verses = Array.from({ length: 50 }, (_, i) => v(i + 1, 40 + (i % 7) * 30));
    const pages = paginate(verses, 300, "arabic");
    expect(pages.flat().map((x) => x.numberInSurah)).toEqual(verses.map((x) => x.numberInSurah));
  });

  it("starts a new page when the next ayah would overflow", () => {
    const pages = paginate([v(1, 200), v(2, 200), v(3, 50)], 300, "arabic");
    expect(pages.map((p) => p.map((x) => x.numberInSurah))).toEqual([[1], [2, 3]]);
  });

  it("gives an ayah longer than a page its own page", () => {
    const pages = paginate([v(1, 50), v(2, 900), v(3, 50)], 300, "arabic");
    expect(pages.map((p) => p.map((x) => x.numberInSurah))).toEqual([[1], [2], [3]]);
  });

  it("fits fewer ayahs per page with translation shown", () => {
    const verses = Array.from({ length: 20 }, (_, i) => v(i + 1, 100, 300));
    const arabicPages = paginate(verses, pageBudget("arabic", 32), "arabic").length;
    const translatedPages = paginate(verses, pageBudget("arabic", 32), "translated").length;
    expect(translatedPages).toBeGreaterThan(arabicPages);
  });

  it("fits fewer characters per page when the Arabic text is larger", () => {
    expect(pageBudget("arabic", 48)).toBeLessThan(pageBudget("arabic", 32));
  });
});
