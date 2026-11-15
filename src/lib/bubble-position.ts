/** Where the draggable teacher bubble rests: stuck to the left or right edge, at a height the user chose. */
export type BubbleSpot = { side: "left" | "right"; y: number };

export const BUBBLE_SIZE = 60;
const EDGE = 12;
const TOP = 76; // below the app header

/** Keeps clear of the bottom tab bar and mini player on phones. */
export const bottomReserve = (vw: number) => (vw < 1024 ? 150 : 48);

export const DEFAULT_SPOT: BubbleSpot = { side: "right", y: 1 };

/** y is stored as 0..1 of the free vertical space, so the spot survives rotation and resizing. */
export function restingXY(spot: BubbleSpot, vw: number, vh: number) {
  const maxY = Math.max(TOP, vh - bottomReserve(vw) - BUBBLE_SIZE);
  const y = TOP + Math.min(1, Math.max(0, spot.y)) * (maxY - TOP);
  const x = spot.side === "left" ? EDGE : vw - BUBBLE_SIZE - EDGE;
  return { x, y };
}

/** After a drag, the bubble snaps to the nearer edge at the height it was dropped. */
export function spotFromDrop(x: number, y: number, vw: number, vh: number): BubbleSpot {
  const maxY = Math.max(TOP + 1, vh - bottomReserve(vw) - BUBBLE_SIZE);
  const side = x + BUBBLE_SIZE / 2 < vw / 2 ? "left" : "right";
  return { side, y: Math.min(1, Math.max(0, (y - TOP) / (maxY - TOP))) };
}

export function clampDrag(x: number, y: number, vw: number, vh: number) {
  return {
    x: Math.min(vw - BUBBLE_SIZE - 4, Math.max(4, x)),
    y: Math.min(vh - BUBBLE_SIZE - 4, Math.max(64, y)),
  };
}

export function isBubbleSpot(v: unknown): v is BubbleSpot {
  const o = v as BubbleSpot | null;
  return !!o && (o.side === "left" || o.side === "right") && typeof o.y === "number" && Number.isFinite(o.y);
}
