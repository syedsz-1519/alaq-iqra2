/** Qalqalah & Ghunnah review rubric, based on chapters 3–4 of The Little Tajweed Guide. */
export type Rating = "good" | "practice" | "not_heard";
export type RubricResult = { id: string; group: "qalqalah" | "ghunnah"; rating: Rating; note: string };

export const RUBRICS: {
  id: "qalqalah" | "ghunnah";
  title: string;
  criteria: { id: string; label: string; check: string }[];
}[] = [
  {
    id: "qalqalah",
    title: "Qalqalah",
    criteria: [
      { id: "q-release", label: "Bounce on ق ط ب ج د with sukun", check: "each qalqalah letter with sukun has a light, audible release" },
      { id: "q-no-vowel", label: "No added vowel", check: "the bounce does not turn into an extra 'a', 'eh' or 'uh' sound" },
      { id: "q-kubra", label: "Stronger when stopping", check: "the echo is clearer when stopping on a qalqalah letter (Kubra), strongest with shaddah" },
    ],
  },
  {
    id: "ghunnah",
    title: "Ghunnah",
    criteria: [
      { id: "g-shaddah", label: "Noon & meem with shaddah", check: "نّ and مّ carry a nasal sound held for about two counts" },
      { id: "g-hidden", label: "Idgham, ikhfa & iqlab", check: "the nasal sound is held about two counts where noon/tanween or meem merges, is hidden, or changes to meem" },
      { id: "g-izhar", label: "Clear in izhar", check: "noon and meem before izhar letters are pronounced clearly with no prolonged nasal sound" },
    ],
  },
];

export const RATING_LABEL: Record<Rating, string> = { good: "Good", practice: "Practise", not_heard: "Not in passage / unclear" };

/** Share of rated criteria marked good, ignoring criteria that could not be heard. */
export function rubricScore(results: RubricResult[]) {
  const rated = results.filter((r) => r.rating !== "not_heard");
  if (!rated.length) return null;
  return Math.round((rated.filter((r) => r.rating === "good").length / rated.length) * 100);
}
