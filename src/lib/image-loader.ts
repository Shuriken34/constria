"use client";

// Pozele de pe Pexels sunt redimensionate direct de serverul Pexels (originalele au câțiva MB).
// Pozele locale din /public trec neschimbate.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://images.pexels.com/")) {
    return `${src}?auto=compress&cs=tinysrgb&w=${width}&q=${quality ?? 70}`;
  }
  return src;
}
