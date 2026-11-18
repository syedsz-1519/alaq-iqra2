/** Splits a surah into book-like pages so the reader looks like a printed mushaf. */

export type PageVerse = { numberInSurah: number; arabic: string; translation?: string | undefined };

/** Ayahs on each mushaf page — a steady count makes it easy to recite page by page. */
export const AYAHS_PER_PAGE = 15;

/**
 * Groups ayahs into pages of a fixed number of ayahs, in order. Every ayah appears exactly once;
 * a surah with no more ayahs than that fits on a single page.
 */
export function paginate<T extends PageVerse>(verses: T[], perPage = AYAHS_PER_PAGE): T[][] {
  const size = Math.max(1, Math.floor(perPage));
  const pages: T[][] = [];
  for (let i = 0; i < verses.length; i += size) pages.push(verses.slice(i, i + size));
  return pages;
}

/** Zero-based page that holds this ayah. */
export const pageOfAyah = (ayah: number, perPage = AYAHS_PER_PAGE) => Math.max(0, Math.floor((ayah - 1) / perPage));

/** Number of reading pages in a surah. */
export const pageCount = (totalAyahs: number, perPage = AYAHS_PER_PAGE) => Math.max(1, Math.ceil(totalAyahs / perPage));

/** First and last ayah on a zero-based page. */
export function pageRange(page: number, totalAyahs: number, perPage = AYAHS_PER_PAGE) {
  const from = page * perPage + 1;
  return { from, to: Math.min(totalAyahs, from + perPage - 1) };
}
