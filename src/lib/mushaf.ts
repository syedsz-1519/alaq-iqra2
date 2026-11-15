/** Splits a surah into book-like pages so the reader looks like a printed mushaf. */

export type PageVerse = { numberInSurah: number; arabic: string; translation?: string | undefined };

/** Characters that fit on one page at 32px Arabic; scaled down for bigger text. */
const ARABIC_BUDGET = 560;
const TRANSLATED_BUDGET = 1100;
const BASE_SIZE = 32;

export function pageBudget(view: "arabic" | "translated", arabicSize: number) {
  const base = view === "arabic" ? ARABIC_BUDGET : TRANSLATED_BUDGET;
  const scale = (BASE_SIZE / Math.max(16, arabicSize)) ** 2;
  return Math.round(base * scale);
}

/** Weight of one ayah on the page: Arabic, plus translation text (set smaller, so it counts less). */
export function verseWeight(v: PageVerse, view: "arabic" | "translated") {
  const t = view === "translated" ? (v.translation?.length ?? 0) * 0.6 : 0;
  return v.arabic.length + t;
}

/**
 * Groups ayahs into pages in order. Every ayah appears exactly once; an ayah longer
 * than a full page gets a page to itself rather than being cut.
 */
export function paginate<T extends PageVerse>(verses: T[], budget: number, view: "arabic" | "translated"): T[][] {
  const pages: T[][] = [];
  let page: T[] = [];
  let used = 0;
  for (const v of verses) {
    const w = verseWeight(v, view);
    if (page.length > 0 && used + w > budget) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(v);
    used += w;
  }
  if (page.length) pages.push(page);
  return pages;
}
