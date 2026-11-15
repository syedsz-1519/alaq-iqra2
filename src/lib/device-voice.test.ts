import { describe, expect, it } from "vitest";
import { pickVoice, splitSentences, tajweedLessonScript } from "./device-voice";
import { TAJWEED_TOPICS } from "./tajweed-notes";

const v = (name: string, lang: string, localService: boolean) => ({ name, lang, localService });

describe("offline Tajweed lessons (phone voice)", () => {
  it("builds every lesson only from the bundled Tajweed notes", () => {
    for (const topic of TAJWEED_TOPICS) {
      const text = tajweedLessonScript(topic, { name: "Zaid" }).map((p) => p.text).join(" ");
      expect(text).toContain("This is Zaid");
      for (const s of splitSentences(topic.explanation)) expect(text).toContain(s);
      expect(text).toContain(topic.remember.split(".")[0]!);
    }
  });

  it("speaks the rule's Arabic letters with an Arabic voice", () => {
    const topic = TAJWEED_TOPICS.find((t) => t.letters)!;
    const letters = tajweedLessonScript(topic, { name: "Zaid" }).find((p) => p.lang === "ar");
    expect(letters?.text).toBe(topic.letters);
  });

  it("prefers a voice installed on the phone, so lessons work without internet", () => {
    const voices = [v("Google UK English Male", "en-GB", false), v("Samantha", "en-US", true)];
    expect(pickVoice(voices, "en", "male")?.name).toBe("Samantha");
  });

  it("picks a male voice for Zaid when several on-device voices exist", () => {
    const voices = [v("Samantha", "en-US", true), v("Daniel", "en-GB", true)];
    expect(pickVoice(voices, "en", "male")?.name).toBe("Daniel");
  });

  it("returns no voice when the phone has none for the language", () => {
    expect(pickVoice([v("Daniel", "en-GB", true)], "ar", "male")).toBeUndefined();
  });
});
