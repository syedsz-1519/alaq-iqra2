import { describe, expect, it } from "vitest";
import { splitPhrases } from "./phrases";

const w = (...t: string[]) => t.map((text) => ({ text }));

describe("phrase drill splitting", () => {
  it("never puts more than 4 words in a phrase", () => {
    const words = w("a", "b", "c", "d", "e", "f", "g", "h", "i");
    for (const p of splitPhrases(words)) expect(p.end - p.start + 1).toBeLessThanOrEqual(4);
  });

  it("breaks after a pause mark (2:2 ends a phrase at رَيْبَ ۛ)", () => {
    const words = w("ذَٰلِكَ", "ٱلْكِتَـٰبُ", "لَا", "رَيْبَ ۛ", "فِيهِ ۛ", "هُدًۭى", "لِّلْمُتَّقِينَ");
    expect(splitPhrases(words)).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 4 },
      { start: 5, end: 6 },
    ]);
  });

  it("covers every word exactly once", () => {
    const words = w("a", "b ۖ", "c", "d", "e", "f", "g");
    const ps = splitPhrases(words);
    const covered = ps.flatMap((p) => Array.from({ length: p.end - p.start + 1 }, (_, i) => p.start + i));
    expect(covered).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("phrase drill passing", () => {
  it("passes at 80% of words heard and fails below", async () => {
    const { phrasePassed } = await import("./phrases");
    expect(phrasePassed(80)).toBe(true);
    expect(phrasePassed(75)).toBe(false);
  });
});
