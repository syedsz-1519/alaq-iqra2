import { KEYS, useStored } from "./storage";
import { pageOfAyah } from "./mushaf";

export type LastRead = { surah: number; ayah: number; englishName: string; name: string; total: number; at: number };
export type Bookmark = {
  surah: number;
  ayah: number;
  englishName: string;
  preview: string;
  /** Opening words of the ayah in Arabic (older bookmarks may not have it). */
  arabic?: string;
  at: number;
};
/** Furthest-recent spot reached in each surah, keyed by surah number. */
export type SurahProgress = {
  ayah: number;
  total: number;
  at: number;
  /** Zero-based page the reader was on when saved (informational; the page size can change, so resume uses the ayah). */
  page?: number;
};
export type ProgressMap = Record<string, SurahProgress>;
export type BookmarkOrder = "recent" | "quran";

export const bookmarkKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export function toggleBookmark(list: Bookmark[], b: Omit<Bookmark, "at">, now = Date.now()): Bookmark[] {
  const exists = list.some((x) => x.surah === b.surah && x.ayah === b.ayah);
  if (exists) return list.filter((x) => !(x.surah === b.surah && x.ayah === b.ayah));
  return [{ ...b, at: now }, ...list];
}

export function sortBookmarks(list: Bookmark[], order: BookmarkOrder): Bookmark[] {
  const copy = [...list];
  return order === "recent"
    ? copy.sort((a, b) => b.at - a.at)
    : copy.sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
}

/** Saves the ayah the reader is on in this surah. Unchanged spots return the same map (no extra writes). */
export function recordProgress(map: ProgressMap, surah: number, ayah: number, total: number, now = Date.now()): ProgressMap {
  const a = Math.min(Math.max(Math.round(ayah), 1), total);
  if (map[surah]?.ayah === a) return map;
  return { ...map, [surah]: { ayah: a, total, at: now, page: pageOfAyah(a) } };
}

/** The ayah to offer "continue from" when reopening a surah: only when partway through. */
export function resumeAyah(map: ProgressMap, surah: number): number | null {
  const p = map[surah];
  return p && p.ayah > 1 && p.ayah < p.total ? p.ayah : null;
}

/** The reading page to reopen in a surah, or null when there is nothing to resume. */
export function resumePage(map: ProgressMap, surah: number): number | null {
  const p = map[surah];
  if (!p || p.ayah >= p.total) return null;
  // Always work it out from the ayah, so saves made with an older page size still open the right page.
  const page = pageOfAyah(p.ayah);
  return page > 0 || p.ayah > 1 ? page : null;
}

export const isFinished = (p: { ayah: number; total: number } | null | undefined) => Boolean(p && p.ayah >= p.total);

export function useBookmarks() {
  return useStored<Bookmark[]>(KEYS.bookmarks, []);
}

export function useLastRead() {
  return useStored<LastRead | null>(KEYS.lastRead, null);
}

export function useProgress() {
  return useStored<ProgressMap>(KEYS.progress, {});
}
