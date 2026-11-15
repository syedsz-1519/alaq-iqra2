export type DhikrPreset = {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number;
  source: string;
};

export const DHIKR_PRESETS: DhikrPreset[] = [
  { id: "subhanallah", arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", meaning: "Glory be to Allah", target: 33, source: "Sahih Muslim 597" },
  { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", meaning: "All praise is for Allah", target: 33, source: "Sahih Muslim 597" },
  { id: "allahuakbar", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest", target: 34, source: "Sahih Muslim 596" },
  { id: "tahlil", arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ", transliteration: "La ilaha illallah", meaning: "None has the right to be worshipped but Allah", target: 100, source: "Sunan at-Tirmidhi 3383" },
  { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", meaning: "I seek Allah's forgiveness", target: 100, source: "Sahih Muslim 2702" },
  { id: "subhanallahibihamdihi", arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", transliteration: "SubhanAllahi wa bihamdihi", meaning: "Glory be to Allah and praise Him", target: 100, source: "Sahih al-Bukhari 6405" },
  { id: "salawat", arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", transliteration: "Allahumma salli 'ala Muhammad", meaning: "O Allah, send blessings upon Muhammad", target: 10, source: "Sahih Muslim 408" },
  { id: "hawqala", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration: "La hawla wa la quwwata illa billah", meaning: "There is no might nor power except with Allah", target: 33, source: "Sahih al-Bukhari 6384" },
];

export type DhikrState = { counts: Record<string, number>; day: string; todayTotal: number; lifetime: number };

export const EMPTY_DHIKR: DhikrState = { counts: {}, day: "", todayTotal: 0, lifetime: 0 };

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Adds one tasbih; the daily total resets on a new calendar day. */
export function incrementDhikr(state: DhikrState, id: string, now = new Date()): DhikrState {
  const day = todayKey(now);
  const sameDay = state.day === day;
  return {
    counts: { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 },
    day,
    todayTotal: (sameDay ? state.todayTotal : 0) + 1,
    lifetime: state.lifetime + 1,
  };
}
