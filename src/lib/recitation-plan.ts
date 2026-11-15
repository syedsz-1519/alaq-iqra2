/** Shared (browser-safe) shapes and rules for the AI recitation plan. */
import { z } from "zod";
import { AYAHS_PER_PAGE } from "./mushaf";

export const PLAN_GOALS = {
  recite: "Recite fluently",
  memorize: "Memorize (hifz)",
  revise: "Revise what I know",
  tajweed: "Improve my tajweed",
} as const;
export const PLAN_LEVELS = { beginner: "Beginner", intermediate: "Intermediate", fluent: "Fluent" } as const;
export const PLAN_LANGS = { en: "English", roman: "Roman Urdu", ur: "Urdu", hi: "Hindi" } as const;
export const PLAN_MINUTES = [5, 10, 15, 20, 30, 45, 60] as const;

export type PlanGoal = keyof typeof PLAN_GOALS;
export type PlanLevel = keyof typeof PLAN_LEVELS;
export type PlanLang = keyof typeof PLAN_LANGS;

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const planInputSchema = z.object({
  surah: z.number().int().min(1).max(114),
  goal: z.enum(keys(PLAN_GOALS)),
  level: z.enum(keys(PLAN_LEVELS)),
  minutesPerDay: z.number().int().min(5).max(120),
  daysPerWeek: z.number().int().min(1).max(7),
  reciter: z.string().max(60).optional(),
  lang: z.enum(keys(PLAN_LANGS)),
});
export type PlanInput = z.infer<typeof planInputSchema>;

/** One 10-ayah page of the surah, numbered from 1 as shown in the reader. */
export type PlanPage = { page: number; from: number; to: number; words: number };

export function planPages(ayahWordCounts: number[], perPage = AYAHS_PER_PAGE): PlanPage[] {
  const pages: PlanPage[] = [];
  for (let i = 0; i < ayahWordCounts.length; i += perPage) {
    const slice = ayahWordCounts.slice(i, i + perPage);
    pages.push({ page: pages.length + 1, from: i + 1, to: i + slice.length, words: slice.reduce((a, b) => a + b, 0) });
  }
  return pages;
}

/** Rough minutes to work through a page: words at the reader's pace, with extra repetition for memorizing. */
export function estimateMinutes(words: number, level: PlanLevel, goal: PlanGoal) {
  const wpm = level === "beginner" ? 18 : level === "intermediate" ? 32 : 50;
  const repeat = goal === "memorize" ? 5 : goal === "tajweed" ? 2 : goal === "revise" ? 1 : 1.5;
  return Math.max(1, Math.round((words / wpm) * repeat));
}

export type PlanPace = "slow" | "steady" | "brisk";
export type PlanSession = { day: number; pages: number[]; minutes: number; focus: string };
export type PlanPageTip = PlanPage & { minutes: number; pace: PlanPace; tip: string };
export type RecitationPlan = {
  surah: number;
  englishName: string;
  name: string;
  totalAyahs: number;
  createdAt: number;
  input: PlanInput;
  overview: string;
  sessions: PlanSession[];
  pageTips: PlanPageTip[];
  generalTips: string[];
};

/** What the model returns (before it is checked against the real pages). */
export type RawPlan = {
  overview: string;
  sessions: { day: number; pages: number[]; minutes: number; focus: string }[];
  page_tips: { page: number; minutes: number; pace: string; tip: string }[];
  general_tips: string[];
};

const clampText = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

/**
 * Keeps the model's plan honest: only real page numbers, every page exactly once in the tips
 * (missing pages get the estimated time and no tip), sessions in day order, nothing empty.
 */
export function normalizePlan(
  raw: RawPlan,
  pages: PlanPage[],
  input: PlanInput,
): Pick<RecitationPlan, "overview" | "sessions" | "pageTips" | "generalTips"> {
  const valid = new Set(pages.map((p) => p.page));
  const tipFor = new Map<number, RawPlan["page_tips"][number]>();
  for (const t of raw.page_tips ?? []) if (valid.has(t.page) && !tipFor.has(t.page)) tipFor.set(t.page, t);

  const pageTips: PlanPageTip[] = pages.map((p) => {
    const t = tipFor.get(p.page);
    const pace: PlanPace = t?.pace === "slow" || t?.pace === "brisk" ? t.pace : "steady";
    const minutes = t && Number.isFinite(t.minutes) && t.minutes > 0 ? Math.min(240, Math.round(t.minutes)) : estimateMinutes(p.words, input.level, input.goal);
    return { ...p, minutes, pace, tip: clampText(t?.tip, 400) };
  });

  const sessions: PlanSession[] = (raw.sessions ?? [])
    .map((s) => ({
      day: Math.round(s.day),
      pages: [...new Set((s.pages ?? []).filter((p) => valid.has(p)))].sort((a, b) => a - b),
      minutes: Math.max(1, Math.min(240, Math.round(s.minutes || input.minutesPerDay))),
      focus: clampText(s.focus, 300),
    }))
    .filter((s) => s.pages.length > 0 && s.day > 0)
    .sort((a, b) => a.day - b.day)
    .map((s, i) => ({ ...s, day: i + 1 }));

  return {
    overview: clampText(raw.overview, 800),
    sessions,
    pageTips,
    generalTips: (raw.general_tips ?? []).map((t) => clampText(t, 300)).filter(Boolean).slice(0, 6),
  };
}
