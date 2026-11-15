import { describe, expect, it } from "vitest";
import { BUBBLE_SIZE, DEFAULT_SPOT, restingXY, spotFromDrop } from "./bubble-position";

describe("draggable Zaid bubble", () => {
  it("snaps to the nearer screen edge where it is dropped", () => {
    expect(spotFromDrop(40, 300, 390, 844).side).toBe("left");
    expect(spotFromDrop(300, 300, 390, 844).side).toBe("right");
  });

  it("stays where it was dropped vertically", () => {
    const spot = spotFromDrop(300, 400, 390, 844);
    expect(restingXY(spot, 390, 844).y).toBeCloseTo(400, 0);
  });

  it("never rests under the phone's bottom tab bar", () => {
    const { y } = restingXY({ side: "right", y: 1 }, 390, 844);
    expect(y + BUBBLE_SIZE).toBeLessThanOrEqual(844 - 150);
  });

  it("starts at the bottom-right corner", () => {
    const { x } = restingXY(DEFAULT_SPOT, 390, 844);
    expect(x).toBe(390 - BUBBLE_SIZE - 12);
  });
});
