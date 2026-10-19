interface ReportEntry {
  search: string;
  infos: { level?: string }[];
  changes: unknown[];
}

/** Page item cards while retaining the complete evidence for JSON export. */
export function reportPage<T extends ReportEntry>(entries: readonly T[], query = "", filter = "all", requestedPage = 0) {
  const terms = query.normalize("NFKC").toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matching = entries.filter(entry => terms.every(term => entry.search.includes(term))
    && (filter === "all" || (filter === "changed" ? entry.changes.length > 0 : entry.infos.some(info => info.level === filter))));
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.max(0, Math.min(pageCount - 1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0));
  return { entries: matching.slice(page * pageSize, (page + 1) * pageSize), total: matching.length, page, pageCount };
}
