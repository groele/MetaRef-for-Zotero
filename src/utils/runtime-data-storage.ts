import type { BatchResult } from "../modules/runner";
import type { RuntimeData, RuntimeItem, RuntimeRun } from "./runtime-data-policy";
import { boundRuntimeRuns, normalizeRuntimeRun, RUNTIME_HISTORY_BYTES } from "./runtime-data-policy";

const logger = { debug: (...args: unknown[]) => Zotero.debug(`[MetaFlow runtime-data] ${args.map(String).join(" ")}`) };

export class RuntimeDataStore {
  private ready?: Promise<void>;
  private runs: RuntimeRun[] = [];
  private timer?: ReturnType<typeof setTimeout>;
  private writes = Promise.resolve();
  private generation = 0;
  private revision = 0;
  private dirty = false;
  private queuedRevision = -1;
  private healthy = false;
  private persisted?: RuntimeData;
  private readOnly = false;

  constructor(public readonly file: string) {}

  private async load() {
    this.ready ||= (async () => {
      for (const path of [this.file, `${this.file}.bak`]) {
        try {
          if (!await IOUtils.exists(path))
            continue;
          if ((await IOUtils.stat(path)).size! > RUNTIME_HISTORY_BYTES * 2)
            continue;
          const data = await IOUtils.readJSON(path) as Partial<RuntimeData>;
          if (typeof data?.version === "number" && data.version > 1) {
            this.readOnly = true;
            return;
          }
          if (data?.version !== 1 || !Array.isArray(data.runs))
            continue;
          this.runs = boundRuntimeRuns(data.runs);
          this.healthy = path === this.file;
          this.persisted = { version: 1, updatedAt: typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt) ? data.updatedAt : 0, runs: this.runs };
          if (this.runs.length !== data.runs.length) {
            this.dirty = true;
            this.revision++;
          }
          return;
        }
        catch (error) { logger.debug("Cannot read runtime data; trying backup", error); }
      }
    })();
    await this.ready;
  }

  public async read(): Promise<RuntimeData> {
    await this.load();
    return JSON.parse(JSON.stringify({ version: 1, updatedAt: this.persisted?.updatedAt || 0, runs: boundRuntimeRuns(this.runs) }));
  }

  public async append(value: RuntimeRun) {
    const token = this.generation;
    const entry = normalizeRuntimeRun(value);
    await this.load();
    if (!entry || token !== this.generation || this.readOnly)
      return;
    this.runs = boundRuntimeRuns([...this.runs, entry]);
    this.dirty = true;
    this.revision++;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush().catch(error => logger.debug("Runtime data write failed", error));
    }, 500);
  }

  public async flush(clearBackup = false) {
    clearTimeout(this.timer);
    this.timer = undefined;
    await this.load();
    if (this.readOnly || (!this.dirty && this.healthy))
      return this.writes;
    const revision = this.revision;
    if (this.queuedRevision === revision)
      return this.writes;
    this.queuedRevision = revision;
    const snapshot: RuntimeData = { version: 1, updatedAt: Date.now(), runs: boundRuntimeRuns(this.runs) };
    this.writes = this.writes.catch(() => {}).then(async () => {
      if (!clearBackup && this.persisted)
        await IOUtils.writeJSON(`${this.file}.bak`, { ...this.persisted, runs: boundRuntimeRuns(this.persisted.runs) }, { tmpPath: `${this.file}.bak.tmp` });
      await IOUtils.writeJSON(this.file, snapshot, { tmpPath: `${this.file}.tmp` });
      if (clearBackup)
        await IOUtils.writeJSON(`${this.file}.bak`, snapshot, { tmpPath: `${this.file}.bak.tmp` });
      this.healthy = true;
      this.persisted = snapshot;
      if (this.revision === revision)
        this.dirty = false;
    }).catch((error) => {
      if (this.queuedRevision === revision)
        this.queuedRevision = -1;
      throw error;
    });
    return this.writes;
  }

  public async clear() {
    await this.load();
    if (this.readOnly)
      throw new Error("A newer runtime data format must be cleared by its owning plugin version.");
    this.generation++;
    this.runs = [];
    this.revision++;
    this.dirty = true;
    await this.flush(true);
  }
}

let store: RuntimeDataStore | undefined;
const runIDs = new WeakMap<BatchResult, string>();
export function runtimeDataPath(): string {
  return PathUtils.join((Zotero as any).Profile.dir, "metaflow-runtime-data-v1.json");
}
function runtimeStore() {
  return store ||= new RuntimeDataStore(runtimeDataPath());
}
export const readRuntimeData = () => runtimeStore().read();
export const clearRuntimeData = () => runtimeStore().clear();
export const flushRuntimeData = () => store?.flush() || Promise.resolve();

/** Update an existing run when a later related-version stage adds its final outcome. */
export function recordRuntimeResult(result: BatchResult, kind = "rules") {
  try {
    if (!runIDs.has(result))
      runIDs.set(result, `${Date.now()}-${Zotero.Utilities.randomString()}`);
    const rows = result.records.slice(0, 200);
    const changes = result.changes.slice(0, 200);
    const items = new Map<number, RuntimeItem>();
    for (const id of new Set([...rows.map(row => row.itemID), ...changes.map(change => change.itemID)])) {
      if (id <= 0 || items.size >= 50)
        continue;
      const item = Zotero.Items.get(id);
      if (item)
        items.set(id, { libraryID: item.libraryID, key: item.key, saved: changes.some(change => change.itemID === id && change.saved) || rows.some(row => row.itemID === id && ["duplicate-merged", "duplicate-related"].includes(row.code || "")), fields: [...new Set(changes.filter(change => change.itemID === id).map(change => change.field))], reasons: [...new Set(rows.filter(row => row.itemID === id).map(row => row.code || row.level || "info"))] });
    }
    const entry: RuntimeRun = { id: runIDs.get(result)!, at: Date.now(), kind, total: result.total, processed: result.processed, saved: result.saved, failed: result.failed, warnings: result.warnings, cancelled: result.cancelled, durationMs: result.durationMs || 0, rules: [...new Set([...rows.map(row => row.ruleID), ...changes.map(change => change.ruleID)])], reasons: [...new Set(rows.map(row => row.code || row.level || "info"))], items: [...items.values()], truncated: result.records.length > 200 || result.changes.length > 200 || new Set([...rows.map(row => row.itemID), ...changes.map(change => change.itemID)]).size > 50 };
    void runtimeStore().append(entry).catch(error => logger.debug("Runtime recording failed", error));
  }
  catch (error) { logger.debug("Runtime recording failed; item saving is unaffected", error); }
}
