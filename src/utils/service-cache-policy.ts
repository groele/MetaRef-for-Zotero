export const SERVICE_CACHE_TTL = 72 * 60 * 60_000;
export const SERVICE_CACHE_LIMIT = 1024;

export function publicationCacheName(title: string): string {
  return title.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}
