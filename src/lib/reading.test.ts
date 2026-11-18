import { describe, expect, it } from "vitest";
import { isFinished, recordProgress, resumeAyah, resumePage, sortBookmarks, toggleBookmark, type Bookmark } from "./reading";

describe("reading progress", () => {
  it("remembers a separate spot for each surah", () => {
    let m = recordProgress({}, 2, 45, 286, 1);
    m = recordProgress(m, 18, 10, 110, 2);
    expect(m[2]?.ayah).toBe(45);
    expect(m[18]?.ayah).toBe(10);
  });

  it("offers to continue only when partway through a surah", () => {
    const m = { 2: { ayah: 45, total: 286, at: 1 }, 1: { ayah: 1, total: 7, at: 1 }, 112: { ayah: 4, total: 4, at: 1 } };
    expect(resumeAyah(m, 2)).toBe(45);
    expect(resumeAyah(m, 1)).toBeNull();
    expect(resumeAyah(m, 112)).toBeNull();
    expect(resumeAyah(m, 36)).toBeNull();
  });

  it("counts a surah as finished once its last ayah is reached", () => {
    expect(isFinished({ ayah: 4, total: 4 })).toBe(true);
    expect(isFinished({ ayah: 3, total: 4 })).toBe(false);
  });

  it("keeps the ayah inside the surah", () => {
    expect(recordProgress({}, 112, 9, 4)[112]?.ayah).toBe(4);
  });
});

describe("bookmark order", () => {
  const b = (surah: number, ayah: number, at: number): Bookmark => ({ surah, ayah, at, englishName: "", preview: "" });
  it("sorts newest first or in Quran order", () => {
    const list = [b(2, 255, 1), b(1, 5, 3), b(2, 10, 2)];
    expect(sortBookmarks(list, "recent").map((x) => x.at)).toEqual([3, 2, 1]);
    expect(sortBookmarks(list, "quran").map((x) => `${x.surah}:${x.ayah}`)).toEqual(["1:5", "2:10", "2:255"]);
    expect(toggleBookmark(list, b(2, 255, 0))).toHaveLength(2);
  });
});

describe("saved reading page", () => {
  it("saves the page the reader is on in each surah", () => {
    const m = recordProgress({}, 2, 35, 286, 1);
    expect(m[2]?.page).toBe(2); // ayahs 31–45
    expect(recordProgress(m, 2, 45, 286, 2)[2]?.page).toBe(2);
    expect(recordProgress(m, 2, 46, 286, 3)[2]?.page).toBe(3);
  });

  it("reopens the saved page, or nothing when the surah is finished or untouched", () => {
    expect(resumePage({ 2: { ayah: 45, total: 286, at: 1, page: 2 } }, 2)).toBe(2);
    expect(resumePage({ 2: { ayah: 45, total: 286, at: 1 } }, 2)).toBe(2); // older save without page
    // saved when pages held 10 ayahs (page 4 = ayahs 41–50): reopens the 15-ayah page holding ayah 45
    expect(resumePage({ 2: { ayah: 45, total: 286, at: 1, page: 4 } }, 2)).toBe(2);
    expect(resumePage({ 2: { ayah: 1, total: 286, at: 1, page: 0 } }, 2)).toBeNull();
    expect(resumePage({ 112: { ayah: 4, total: 4, at: 1, page: 0 } }, 112)).toBeNull();
    expect(resumePage({}, 36)).toBeNull();
  });
});
