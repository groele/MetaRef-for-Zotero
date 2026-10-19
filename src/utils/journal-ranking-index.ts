import type { EasyScholarField, EasyScholarRank } from "./easyscholar";
import { EASYSCHOLAR_FIELD_DEFINITIONS } from "./easyscholar";
import { createLogger } from "./logger";

interface Entry { updatedAt: number; values: Partial<Record<EasyScholarField, string>> }
interface Store { version: 1; entries: Record<string, Entry> }
const logger = createLogger("journal-ranking-index");
const entries = new Map<string, Entry>();
const MAX_ENTRIES = 20_000;
const MEMBERSHIP_FIELDS = new Set<EasyScholarField>(["sci", "ssci", "ei", "utd24", "ft50", "cssci", "pku", "cscd", "technologyCore"]);
let ready: Promise<void> | undefined;
let writes = Promise.resolve();
let timer: ReturnType<typeof setTimeout> | undefined;
let revision = 0;
let dirty = false;
let queuedRevision = -1;
let readOnly = false;

function filePath() {
  return typeof IOUtils !== "undefined" && (Zotero as any).Profile?.dir
    ? PathUtils.join((Zotero as any).Profile.dir, "metaflow-journal-rankings-v1.json")
    : undefined;
}

function normalize(value: unknown) {
  return String(value || "").normalize("NFKC").trim().toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

function keys(item: Zotero.Item) {
  const type = item.itemType === "conferencePaper" ? "conference" : "journal";
  const title = item.itemType === "conferencePaper"
    ? item.getField("proceedingsTitle") || item.getField("conferenceName")
    : item.getField("publicationTitle");
  const issns = String(item.getField("ISSN") || "").split(/[;,\s]+/).map(value => value.replace(/[^\dX]/gi, "").toUpperCase()).filter(Boolean);
  return [...issns.map(value => `${type}:issn:${value}`), ...(normalize(title) ? [`${type}:title:${normalize(title)}`] : [])];
}

async function load() {
  ready ||= (async () => {
    const path = filePath();
    if (!path)
      return;
    try {
      if (!(await IOUtils.exists(path)))
        return;
      const store = await IOUtils.readJSON(path) as Store;
      if (store.version > 1) {
        readOnly = true;
        logger.warn("Journal ranking index uses a newer format; preserving the file without rewriting it");
        return;
      }
      if (store.version !== 1 || !store.entries || typeof store.entries !== "object")
        return;
      for (const [key, entry] of Object.entries(store.entries).slice(-MAX_ENTRIES)) {
        if (!key || !Number.isFinite(entry?.updatedAt) || !entry.values || typeof entry.values !== "object")
          continue;
        const values: Entry["values"] = {};
        for (const field of EASYSCHOLAR_FIELD_DEFINITIONS) {
          const value = entry.values[field.key];
          if (typeof value === "string" && value.trim())
            values[field.key] = value.trim();
        }
        if (Object.keys(values).length)
          entries.set(key, { updatedAt: entry.updatedAt, values });
      }
    }
    catch (error) { logger.warn("Unable to load local journal rankings", error); }
  })();
  await ready;
}

function scheduleWrite() {
  if (readOnly)
    return;
  if (timer)
    clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void flushJournalRankingIndex().catch(error => logger.error("Unable to save local journal rankings", error));
  }, 250);
}

export async function loadJournalRankingIndex() {
  await load();
}

export function readJournalRankingIndex(item: Zotero.Item) {
  const result = new Map<EasyScholarField, string>();
  for (const key of keys(item)) {
    for (const [field, value] of Object.entries(entries.get(key)?.values || {}) as [EasyScholarField, string][]) {
      if (!result.has(field))
        result.set(field, value);
    }
  }
  return result;
}

export async function saveJournalRankingIndex(item: Zotero.Item, values: Partial<EasyScholarRank>, selected: ReadonlySet<EasyScholarField>, mode: "blank" | "all" = "all") {
  await load();
  const itemKeys = keys(item);
  if (!itemKeys.length || !selected.size)
    return;
  const existing = readJournalRankingIndex(item);
  const next = new Map(existing);
  let changed = false;
  for (const field of selected) {
    if (mode === "blank" && next.has(field))
      continue;
    const value = values[field];
    if (typeof value === "string" && value.trim()) {
      if (MEMBERSHIP_FIELDS.has(field) && /^(?:否|no|false|0)$/i.test(value.trim())) {
        changed = next.delete(field) || changed;
      }
      else if (next.get(field) !== value.trim()) {
        next.set(field, value.trim());
        changed = true;
      }
    }
  }
  if (!changed)
    return;
  dirty = true;
  revision++;
  const snapshot = { updatedAt: Date.now(), values: Object.fromEntries(next) as Entry["values"] };
  for (const key of itemKeys) {
    entries.delete(key);
    entries.set(key, snapshot);
  }
  while (entries.size > MAX_ENTRIES)
    entries.delete(entries.keys().next().value!);
  scheduleWrite();
}

export async function flushJournalRankingIndex() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  const path = filePath();
  if (!path)
    return;
  if (readOnly || !dirty || queuedRevision === revision)
    return writes;
  const token = revision;
  queuedRevision = token;
  const data: Store = { version: 1, entries: Object.fromEntries(entries) };
  const write = writes.catch(() => {}).then(async () => {
    await IOUtils.writeJSON(path, data, { tmpPath: `${path}.tmp` });
    if (revision === token)
      dirty = false;
  }).catch((error) => {
    if (queuedRevision === token)
      queuedRevision = -1;
    throw error;
  });
  writes = write;
  await write;
}

export function resetJournalRankingIndex() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  entries.clear();
  ready = undefined;
  dirty = false;
  readOnly = false;
  queuedRevision = -1;
  revision++;
}
