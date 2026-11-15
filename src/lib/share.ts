/** Link previews show only the Alaq calligraphy logo (public/og-image.jpg, 1200x630). */
export const SHARE_IMAGE_PATH = "/og-image.jpg";

export function shareImage(origin: string | undefined) {
  const tags: { name?: string; property?: string; content: string }[] = [{ name: "twitter:card", content: "summary_large_image" }];
  if (!origin) return tags;
  const url = `${origin}${SHARE_IMAGE_PATH}`;
  return [
    ...tags,
    { property: "og:image", content: url },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Alaq — Quran calligraphy logo" },
    { name: "twitter:image", content: url },
  ];
}
