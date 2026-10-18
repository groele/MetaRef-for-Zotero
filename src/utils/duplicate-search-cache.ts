const searches = new Map<number, Promise<Set<number>>>();
let revision = 0;

export function duplicateSearchRevision() {
  return revision;
}

export function clearDuplicateSearchCache() {
  searches.clear();
  revision++;
}

/** Reuse an unchanged library's search; notifier events invalidate before subsequent batches. */
export function cachedDuplicateSearch(libraryID: number, search: () => Promise<Set<number>>): Promise<Set<number>> {
  const existing = searches.get(libraryID);
  if (existing)
    return existing;
  const pending = search().catch((error) => {
    if (searches.get(libraryID) === pending)
      searches.delete(libraryID);
    throw error;
  });
  searches.set(libraryID, pending);
  while (searches.size > 16)
    searches.delete(searches.keys().next().value!);
  return pending;
}
