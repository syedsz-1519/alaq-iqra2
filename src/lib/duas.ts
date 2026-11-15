import index from "@/data/duas-index.json";

export type DuaItem = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  repeat: number;
  audio: string;
};
export type DuaCategory = { id: number; title: string; items: DuaItem[] };
export type DuaCategoryMeta = { id: number; title: string; count: number };

export const DUA_GROUPS = index.groups as { key: string; title: string; ids: number[] }[];
export const DUA_CATEGORIES = index.categories as DuaCategoryMeta[];
export const getDuaCategoryMeta = (id: number) => DUA_CATEGORIES.find((c) => c.id === id);

/** Loads the full Hisnul Muslim text only when a dua page needs it. */
export const loadDuaCategory = async (id: number) => {
  const mod = await import("@/data/duas.json");
  const all = mod.default as DuaCategory[];
  return all.find((c) => c.id === id) ?? null;
};
