import { resolveApiUrl } from "./apiBase";

const API_URL = resolveApiUrl();

function isUsableImageUrl(url: string): boolean {
  const lowered = url.toLowerCase();
  return (
    lowered.startsWith("data:image/") ||
    lowered.includes("wger.de") ||
    lowered.includes("githubusercontent.com")
  );
}

/** URL da miniatura: banco → catálogo GitHub/wger → endpoint da API. */
export function getExerciseImageSrc(name: string, imageUrl: string | null): string {
  if (imageUrl && isUsableImageUrl(imageUrl)) {
    return imageUrl;
  }
  return `${API_URL}/exercises/thumbnail?name=${encodeURIComponent(name)}`;
}
