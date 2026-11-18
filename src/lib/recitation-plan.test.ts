import { describe, expect, it } from "vitest";
import { estimateMinutes, normalizePlan, planPages, type PlanInput } from "./recitation-plan";

const input: PlanInput = { surah: 2, goal: "recite", level: "intermediate", minutesPerDay: 15, daysPerWeek: 5, lang: "en" };

describe("recitation plan pages", () => {
  it("splits the surah into the same 15-ayah pages as the reader", () => {
    const pages = planPages(Array.from({ length: 33 }, () => 4));
    expect(pages.map((p) => [p.page, p.from, p.to, p.words])).toEqual([
      [1, 1, 15, 60],
      [2, 16, 30, 60],
      [3, 31, 33, 12],
    ]);
  });

  it("gives memorizing more time than reciting", () => {
    expect(estimateMinutes(100, "beginner", "memorize")).toBeGreaterThan(estimateMinutes(100, "beginner", "recite"));
  });
});

describe("checking the AI plan", () => {
  const pages = planPages(Array.from({ length: 45 }, () => 5)); // 3 pages of 15

  it("drops made-up pages and keeps every real page exactly once", () => {
    const plan = normalizePlan(
      {
        overview: "ok",
        sessions: [
          { day: 2, pages: [3, 99], minutes: 15, focus: "b" },
          { day: 1, pages: [1, 2, 2], minutes: 15, focus: "a" },
          { day: 3, pages: [42], minutes: 15, focus: "nothing real" },
        ],
        page_tips: [
          { page: 1, minutes: 5, pace: "slow", tip: "x" },
          { page: 1, minutes: 9, pace: "brisk", tip: "duplicate" },
          { page: 7, minutes: 5, pace: "slow", tip: "fake" },
        ],
        general_tips: ["", "breathe"],
      },
      pages,
      input,
    );
    expect(plan.pageTips.map((t) => t.page)).toEqual([1, 2, 3]);
    expect(plan.pageTips[0]?.tip).toBe("x");
    expect(plan.pageTips[1]?.tip).toBe("");
    expect(plan.sessions.map((s) => [s.day, s.pages])).toEqual([
      [1, [1, 2]],
      [2, [3]],
    ]);
    expect(plan.generalTips).toEqual(["breathe"]);
  });
});
