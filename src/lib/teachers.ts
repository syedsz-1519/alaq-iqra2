/** The two Alaq voice teachers. Client-safe: shared by the UI and the voice relay. */
export const TEACHERS = {
  zaid: { id: "zaid", name: "Zaid", arabic: "زَيْد", role: "brother", voice: "meridian", ttsVoice: "Charon", blurb: "A gentle, humble male teacher" },
  zara: { id: "zara", name: "Zara", arabic: "زَارَا", role: "sister", voice: "gleam", ttsVoice: "Sulafat", blurb: "A gentle, humble female teacher" },
} as const;

export type TeacherId = keyof typeof TEACHERS;
export type Teacher = (typeof TEACHERS)[TeacherId];
export const TEACHER_IDS: TeacherId[] = ["zaid", "zara"];

export const isTeacherId = (v: unknown): v is TeacherId => v === "zaid" || v === "zara";
export const getTeacher = (id: unknown): Teacher => TEACHERS[isTeacherId(id) ? id : "zaid"];

/** Every teacher listens and replies in each of these languages. */
export const TEACHER_LANGUAGES = ["English", "Hindi", "Urdu", "Telugu", "Marathi", "Roman Urdu (Hyderabadi)"] as const;
