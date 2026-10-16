import { createLogger } from "./logger";
import { SERVICE_CACHE_LIMIT, SERVICE_CACHE_TTL } from "./service-cache-policy";

interface StoredResponse { status: number; response: string; responseText: string }
interface Entry { expires: number; value?: StoredResponse; alias?: string }
const logger = createLogger("service-cache");
const entries = new Map<string, Entry>();
let ready: Promise<void> | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let writes = Promise.resolve();
let generation = 0;
let session = 0;
function path() {
  return typeof IOUtils !== "undefined" && (Zotero as any).Profile?.dir
    ? PathUtils.join((Zotero as any).Profile.dir, "metaflow-api-cache-v1.json")
    : undefined;
}
const digest = (key: string) => `${key.slice(0, key.indexOf(":"))}:${Zotero.Utilities.Internal.md5(key)}`;

async function load() {
  ready ||= (async () => {
    const token = session;
    const file = path();
    if (!file)
      return;
    try {
      if (!(await IOUtils.exists(file)))
        return;
      const data = await IOUtils.readJSON(file) as { version?: number; entries?: [string, Entry][] };
      if (![1, 2].includes(data.version || 0) || !Array.isArray(data.entries) || token !== session)
        return;
      for (const row of data.entries.slice(-SERVICE_CACHE_LIMIT)) {
        if (!Array.isArray(row) || row.length !== 2)
          continue;
        const [key, entry] = row;
        const validKey = /^(?:easyscholar|semantic-scholar):[a-f0-9]{32}$/;
        if (typeof key === "string" && validKey.test(key) && Number.isFinite(entry?.expires) && entry.expires > Date.now() && entry.expires <= Date.now() + SERVICE_CACHE_TTL && ((entry.value?.status === 200 && typeof entry.value.response === "string" && typeof entry.value.responseText === "string") || (typeof entry.alias === "string" && validKey.test(entry.alias) && entry.alias.split(":")[0] === key.split(":")[0] && entry.alias !== key)))
          entries.set(key, entry);
      }
    }
    catch (error) { logger.debug("Ignoring unreadable API cache", error); }
  })();
  await ready;
}

function schedule() {
  if (!path())
    return;
  if (timer)
    clearTimeout(timer);
  timer = setTimeout(() => {
    timer = undefined;
    void flushServiceCache();
  }, 500);
}

export async function readServiceCache(key: string) {
  if (!path())
    return;
  await load();
  const entry = entries.get(digest(key));
  const target = entry?.alias ? entries.get(entry.alias) : entry;
  const expires = Math.min(entry?.expires || 0, target?.expires || 0);
  return target?.value && expires > Date.now() ? { ...target.value, _metaflowCacheExpires: expires } : undefined;
}

export async function storeServiceCache(key: string, value: StoredResponse, expires: number) {
  if (!path())
    return;
  const token = generation;
  await load();
  if (token !== generation)
    return;
  const hash = digest(key);
  entries.delete(hash);
  entries.set(hash, { value, expires });
  while (entries.size > SERVICE_CACHE_LIMIT)
    entries.delete(entries.keys().next().value!);
  schedule();
}

export async function storeServiceAliases(key: string, aliases: string[], value: StoredResponse, expires: number) {
  if (!path())
    return;
  const token = generation;
  await load();
  if (token !== generation)
    return;
  const hash = digest(key);
  const primary = entries.get(hash)?.alias || hash;
  let changed = false;
  if (!entries.get(primary)?.value) {
    entries.set(primary, { value, expires });
    changed = true;
  }
  const deadline = Math.min(expires, entries.get(primary)!.expires);
  for (const alias of aliases) {
    const target = digest(alias);
    const previous = entries.get(target);
    if (target !== primary && (previous?.alias !== primary || previous.expires !== deadline || previous.value)) {
      entries.set(target, { alias: primary, expires: deadline });
      changed = true;
    }
  }
  while (entries.size > SERVICE_CACHE_LIMIT)
    entries.delete(entries.keys().next().value!);
  if (changed)
    schedule();
}

export async function clearStoredServiceCache(namespace?: string) {
  generation++;
  await load();
  for (const key of entries.keys()) {
    if (!namespace || key.startsWith(`${namespace}:`))
      entries.delete(key);
  }
  await flushServiceCache();
}

export async function flushServiceCache() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  const file = path();
  if (!file)
    return;
  await load();
  const snapshot = { version: 2, entries: [...entries].filter(([, entry]) => entry.expires > Date.now() && (!entry.alias || Boolean(entries.get(entry.alias)?.value))) };
  writes = writes.then(() => IOUtils.writeJSON(file, snapshot, { tmpPath: `${file}.tmp` })).then(() => {}).catch(error => logger.debug("API cache write failed", error));
  await writes;
}

export function resetServiceCacheSession() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  entries.clear();
  ready = undefined;
  generation++;
  session++;
}
