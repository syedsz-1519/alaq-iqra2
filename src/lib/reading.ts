import { KEYS, useStored } from "./storage";

export type LastRead = { surah: number; ayah: number; englishName: string; name: string; total: number; at: number };
export type Bookmark = { surah: number; ayah: number; englishName: string; preview: string; at: number };

export const bookmarkKey = (surah: number, ayah: number) => `${surah}:${ayah}`;

export function toggleBookmark(list: Bookmark[], b: Omit<Bookmark, "at">, now = Date.now()): Bookmark[] {
  const exists = list.some((x) => x.surah === b.surah && x.ayah === b.ayah);
  if (exists) return list.filter((x) => !(x.surah === b.surah && x.ayah === b.ayah));
  return [{ ...b, at: now }, ...list];
}

export function useBookmarks() {
  return useStored<Bookmark[]>(KEYS.bookmarks, []);
}

export function useLastRead() {
  return useStored<LastRead | null>(KEYS.lastRead, null);
}
