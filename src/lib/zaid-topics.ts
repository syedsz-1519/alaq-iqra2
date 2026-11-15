/** Lessons Zaid can teach. Shared by the call page and the voice relay (client-safe). */
export const ZAID_TOPICS = [
  { id: "open", title: "Ask anything", arabic: "اسأل", blurb: "Any question about the deen", opening: "Ask what the student would like to learn today." },
  { id: "quran", title: "Quran", arabic: "القرآن", blurb: "Recitation, meaning & tafsir", opening: "Offer to recite and explain a short surah or any ayah they choose." },
  { id: "tajweed", title: "Tajweed", arabic: "التجويد", blurb: "Makharij, qalqalah, ghunnah, madd", opening: "Offer a short Tajweed lesson and ask which rule they want to practise." },
  { id: "arabic", title: "Arabic lessons", arabic: "العربية", blurb: "Letters, words & Quranic Arabic", opening: "Offer a beginner Quranic Arabic lesson and ask their current level." },
  { id: "hadith", title: "Hadith", arabic: "الحديث", blurb: "Authentic sayings & their lessons", opening: "Offer to share and explain an authentic hadith on a topic they pick." },
  { id: "duas", title: "Duas", arabic: "الأدعية", blurb: "Daily duas with meaning", opening: "Offer to teach a dua for a moment of their day, like waking or travelling." },
  { id: "fiqh", title: "Fiqh & masail", arabic: "الفقه", blurb: "Salah, wudu, fasting, zakat & more", opening: "Invite a fiqh question about wudu, salah, fasting, zakat or daily masail." },
  { id: "nafs", title: "Taming the nafs", arabic: "تزكية النفس", blurb: "Control desires, build discipline", opening: "Gently offer practical guidance from Quran and Sunnah on controlling the nafs and desires." },
  { id: "ai", title: "AI for Islam", arabic: "الذكاء الاصطناعي", blurb: "Use AI wisely & ethically", opening: "Offer to explain how to use AI tools for learning and serving Islam, ethically and carefully." },
  { id: "creator", title: "Islamic content creation", arabic: "الدعوة الرقمية", blurb: "Start a beneficial channel", opening: "Offer a step-by-step plan for starting beneficial Islamic content, with sincere intention." },
] as const;

export type ZaidTopicId = (typeof ZAID_TOPICS)[number]["id"];
export const ZAID_TOPIC_IDS = ZAID_TOPICS.map((t) => t.id) as ZaidTopicId[];
export const getZaidTopic = (id: string) => ZAID_TOPICS.find((t) => t.id === id) ?? ZAID_TOPICS[0];
