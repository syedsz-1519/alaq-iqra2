import { describe, expect, it } from "vitest";
import { compareRecitation } from "./assignments";
import { rubricScore } from "./rubric";

describe("recitation word check", () => {
  it("scores 100% when every word is recited, ignoring harakat", () => {
    expect(compareRecitation("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "قل هو الله احد").score).toBe(100);
  });
  it("lists missing words", () => {
    const r = compareRecitation("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "قل الله احد");
    expect(r.score).toBe(75);
    expect(r.missing).toEqual(["هو"]);
  });
});

describe("Qalqalah & Ghunnah rubric score", () => {
  it("ignores criteria that could not be heard", () => {
    expect(
      rubricScore([
        { id: "q-release", group: "qalqalah", rating: "good", note: "" },
        { id: "g-shaddah", group: "ghunnah", rating: "practice", note: "" },
        { id: "g-izhar", group: "ghunnah", rating: "not_heard", note: "" },
      ]),
    ).toBe(50);
  });
});
