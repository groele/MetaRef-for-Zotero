import type { Arrayable } from "../utils/types";
import type { FieldChange, ReportInfo } from "./reporter";
import type { ApplyContext, PrepareContext, Rule } from "./rules/rule-base";
import { DataLoader } from "../utils/data-loader";
import { toArray } from "../utils/general";
import { ItemMutationJournal } from "../utils/item-mutation-journal";
import { rollbackItemChanges } from "../utils/item-recovery";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { getPref } from "../utils/prefs";
import { executeRule, normalizedConcurrency, waitForOperation } from "../utils/rule-execution";
import { isFieldValidForItemType } from "../utils/zotero";
import { updateBatchFeedback } from "./batch-feedback";
import { createReporter, ProgressUI } from "./reporter";
import { Rules } from "./rules";

const logger = createLogger("Runner");

interface RunnerStats {
  total: number;
  current: number;
  pass: number;
  error: number;
  startTime: number;
  records: ReportInfo[];
  phase: "idle" | "linting" | "saving";
}

export interface BatchResult {
  total: number;
  processed: number;
  passed: number;
  failed: number;
  saved: number;
  cancelled: boolean;
  skipped: number;
  preparationFailed: number;
  records: ReportInfo[];
  changes: FieldChange[];
  changed: number;
  unchanged: number;
  notApplicable: number;
  warnings: number;
}

function shouldApplyRule(rule: Rule<any>, item: Zotero.Item): boolean {
  // tag and attachment rules are not implemented
  if (rule.scope !== "item" && rule.scope !== "field") {
    return false;
  }
  if (!item.isRegularItem()) {
    return false;
  }
  if (typeof item.isEditable === "function" && !item.isEditable()) {
    return false;
  }
  if (item.deleted) {
    return false;
  }

  /*  For regular item and rule  */
  if (rule.targetItemTypes && rule.ignoreItemTypes) {
    logger.warn(`Rule ${rule.id} has both targetItemTypes and ignoreItemTypes.`);
  }

  // Check item type
  if (rule.targetItemTypes && !rule.targetItemTypes.includes(item.itemType)) {
    logger.debug(`Skip ${rule.id}: ${item.itemType} not supported by this rule`);
    return false;
  }
  if (rule.ignoreItemTypes?.includes(item.itemType)) {
    logger.debug(`Skip ${rule.id}: ${item.itemType} is ignored by this rule`);
    return false;
  }

  if (rule.scope === "field") {
    // if targetField of this rule is primary field, always apply
    if (rule.targetItemField === "creators")
      return true;

    // Check this target field is included in this item type
    if (!isFieldValidForItemType(rule.targetItemField, item.itemType)) {
      if (!rule.includeMappedFields) {
        logger.debug(`Skip ${rule.id}: ${rule.targetItemField} not valid for ${item.itemType}`);
        return false;
      }
      else {
        const mappedFields = (Zotero.ItemFields.getTypeFieldsFromBase(rule.targetItemField, true) as _ZoteroTypes.Item.ItemField[])
          .filter(field => isFieldValidForItemType(field, item.itemType));
        if (!mappedFields.length) {
          logger.debug(`Skip ${rule.id}: no mapped fields for ${rule.targetItemField} are valid for ${item.itemType}`);
          return false;
        }
      }
    }
  }

  return true;
}

export class LintRunner {
  private stats: RunnerStats = this.emptyStats();
  private modifiedItems = new Set<Zotero.Item>();
  private runningQueue: Promise<void> = Promise.resolve();
  private cancelled = false;
  private preparation?: AbortController;
  private saved = 0;
  private failedItems = new Set<number | Zotero.Item>();
  private unsafeItems = new Set<Zotero.Item>();
  private preparationFailed = 0;
  private changes: FieldChange[] = [];
  private savedIDs = new Set<number>();
  private applicableIDs = new Set<number>();
  private lastProgressTime = 0;
  private lastProgressPhase?: RunnerStats["phase"];
  public lastResult?: BatchResult;
  private readonly ui = new ProgressUI({
    onCancel: () => this.cancel(),
  });

  public cancel(): void {
    this.cancelled = true;
    this.preparation?.abort(new Error("Batch cancelled"));
  }

  public async stop(): Promise<void> {
    this.cancel();
    try {
      await this.runningQueue;
    }
    catch (error) {
      logger.error("Batch failed before shutdown:", error);
    }
    finally {
      this.ui.close();
    }
  }

  public async add(params: {
    items: Arrayable<Zotero.Item>;
    rules: Arrayable<Rule<any>>;
    silent?: boolean;
  }): Promise<BatchResult | undefined> {
    const batch = { ...params, items: [...toArray(params.items)], rules: [...toArray(params.rules)] };
    let result: BatchResult | undefined;
    const task = async () => {
      if (!addon.data.alive)
        return;
      await this.runBatch(batch);
      result = this.lastResult;
    };
    this.runningQueue = this.runningQueue.then(task, task);
    await this.runningQueue;
    return result;
  }

  private async runBatch(params: {
    items: Arrayable<Zotero.Item>;
    rules: Arrayable<Rule<any>>;
    silent?: boolean;
  }): Promise<void> {
    const { items: _items, rules: _rules, silent = false } = params;

    this.initStats();
    try {
      try {
        await this.ui.init(silent);
      }
      catch (error) {
        logger.error("Failed to initialize batch progress:", error);
        this.ui.close();
      }

      const items = [...new Map(toArray(_items).filter(item => item?.isRegularItem() && !item.deleted && item.isEditable()).map(item => [item.id || item, item])).values()];
      const rules = [...new Map(toArray(_rules).map(rule => [rule.id, rule])).values()];

      this.stats.phase = "idle";
      this.updateProgress(0, items.length);

      if (!items.length || !rules.length)
        return;
      this.stats.total = items.length;
      const optionsMap = await this.prepareRules(rules, items);
      const hasActiveRules = [...optionsMap.values()].some(opt => opt !== false);

      if (items.length === 0 || !hasActiveRules) {
        return;
      }

      this.stats.phase = "linting";
      this.updateProgress(this.stats.current, this.stats.total);

      let next = 0;
      const worker = async () => {
        while (!this.cancelled && next < items.length) {
          const item = items[next++];
          try {
            await this.lintItem(item, rules, optionsMap);
          }
          catch (error) {
            this.failedItems.add(item.id || item);
            logger.error(error);
          }
          this.updateStats(this.failedItems.has(item.id || item) ? "error" : "pass");
        }
      };
      await Promise.all(Array.from({ length: Math.min(items.length, normalizedConcurrency(getPref("lint.numConcurrent"))) }, worker));
      await this.batchSave();
    }
    finally {
      this.finish(silent);
    }
  }

  // ----------------------------
  // Preparation
  // ----------------------------

  private async prepareRules(rules: Rule<any>[], items: Zotero.Item[]) {
    const optionsMap = new Map<ID, any>();

    for (const rule of rules) {
      if (this.cancelled)
        break;
      const controller = new (Zotero.getMainWindow() as unknown as Window & typeof globalThis).AbortController();
      this.preparation = controller;
      try {
        const ctx: PrepareContext = {
          items,
          debug: (...a) => logger.debug(`[prepare] [${rule.id}]`, ...a),
          signal: controller.signal,
        };
        const options = await waitForOperation(() => rule.prepare?.(ctx), controller.signal, rule.prepareTimeout ?? (rule.category === "tool" ? 0 : 60_000)) ?? {};
        optionsMap.set(rule.id, options);
        if (options === false && rule.category === "tool") {
          this.cancel();
          break;
        }
      }
      catch (err) {
        controller.abort(err);
        if (this.cancelled)
          break;
        this.preparationFailed++;
        this.stats.records.push({
          message: err instanceof Error ? err.message : String(err),
          level: "error",
          itemID: 0,
          title: getString("report-prepare-failed"),
          ruleID: rule.id,
        });
        logger.error(`Failed to prepare rule ${rule.id}:`, err);

        optionsMap.set(rule.id, false);
      }
      finally {
        this.preparation = undefined;
      }
    }

    logger.debug("Options map:", optionsMap);
    return optionsMap;
  }

  // ----------------------------
  // Queue
  // ----------------------------

  // ----------------------------
  // Lint item
  // ----------------------------

  public async lintItem(
    item: Zotero.Item,
    rules: Rule<any>[],
    optionsMap: Map<string, any>,
  ) {
    logger.debug(`Linting item ${item.id}`);
    if (this.unsafeItems.has(item)) {
      await item.reload(["primaryData", "itemData", "creators", "tags", "collections", "relations"], true);
      this.unsafeItems.delete(item);
    }
    const errors: any[] = [];
    const original = JSON.stringify(item.toJSON());

    for (const rule of rules) {
      if (this.cancelled || this.unsafeItems.has(item))
        break;
      if (!optionsMap.has(rule.id))
        continue;
      const options = optionsMap.get(rule.id);
      if (options === false) {
        logger.debug(`Skip ${rule.id}: options is false`);
        continue;
      }

      // We expect one rule's error does not affect next rule apply,
      // so we eat any error here and throw them after all rules applied.
      await Promise.resolve().then(() => {
        if (shouldApplyRule(rule, item)) {
          this.applicableIDs.add(item.id);
          return this.applyRule(item, rule, options);
        }
      }).catch((error) => {
        let message: string = "";
        // Zotero.HTTP.request error, the message is too long, here we just show the status
        if (error && typeof error === "object" && "xmlhttp" in error && "message" in error)
          message += `HTTP request error: status ${error.status}, ${String(error.message).slice(0, 250)}`;
          // For regular error, we just show the message in the reporter window
        else if (error instanceof Error || (error && typeof error === "object" && "message" in error))
          message += `${error.name || "Error"}: ${error.message}`;
          // If error not have message, we show the error string
        else
          message += String(error);

        this.stats.records.push({
          message,
          level: "error",
          itemID: item.id,
          title: item.getDisplayTitle(),
          ruleID: rule.id,
        });

        logger.error(`[${rule.id}]`, error);

        errors.push(error);
      });
    }

    if (!this.unsafeItems.has(item) && item.hasChanged() && JSON.stringify(item.toJSON()) !== original) {
      this.modifiedItems.add(item);
    }

    // If there are errors, throw a error so queue can catch
    if (errors.length)
      throw new Error(`Item ${item.id} failed ${errors.length} rules`, { cause: errors });
  }

  private async batchSave(): Promise<void> {
    if (this.modifiedItems.size === 0)
      return;

    const items = [...this.modifiedItems];
    const snapshots = new Map(items.map(item => [item, item.toJSON()]));
    this.stats.phase = "saving";
    this.updateProgress(0, items.length);

    try {
      let savedCount = 0;
      const committedIDs: number[] = [];
      await Zotero.DB.executeTransaction(async () => {
        for (const item of items) {
          if (!item.hasChanged())
            continue;
          await item.save({ skipSelect: true });
          savedCount++;
          committedIDs.push(item.id);
          this.updateProgress(savedCount, items.length);
        }
        if (savedCount > 0) {
          // @ts-expect-error - Zotero.UndoHistory not yet typed in zotero-types
          Zotero.UndoHistory?.stageAction?.(
            "metaref-undo-action-lint-metadata",
            { count: savedCount },
          );
        }
      });
      this.saved = savedCount;
      committedIDs.forEach(id => this.savedIDs.add(id));
    }
    catch (err) {
      logger.warn("Batch transaction save failed, falling back to individual saveTx:", err);
      for (const item of items) {
        try {
          // save() reloads the item before commit. Rollback does not restore its change flags.
          if (item.id)
            await item.reload(["primaryData", "itemData", "creators", "tags", "collections", "relations"], true);
          item.fromJSON(snapshots.get(item)!, { strict: true });
          await item.saveTx({ skipSelect: true, ...{ undoAction: "metaref-undo-action-lint-metadata", undoActionArgs: { count: 1 } } });
          this.saved++;
          this.savedIDs.add(item.id);
        }
        catch (itemErr) {
          this.stats.records.push({
            message: itemErr instanceof Error ? itemErr.message : String(itemErr),
            level: "error",
            itemID: item.id,
            title: item.getDisplayTitle(),
            ruleID: "item-save",
          });
          logger.error(`Failed to save item ${item.id}:`, itemErr);
          this.failedItems.add(item.id || item);
          const recovered = rollbackItemChanges(item.toJSON() as Record<string, unknown>, this.changes.filter(change => change.itemID === item.id));
          try {
            await item.reload(["primaryData", "itemData", "creators", "tags", "collections", "relations"], true);
            const persisted = item.toJSON() as Record<string, unknown>;
            for (const field of ["key", "version", "dateAdded", "dateModified"])
              recovered[field] = persisted[field];
            item.fromJSON(recovered, { strict: true });
          }
          catch (recoveryError) {
            this.unsafeItems.add(item);
            this.stats.records.push({ itemID: item.id, title: item.getDisplayTitle(), ruleID: "item-save", level: "error", message: getString("rule-rollback-failed") });
            logger.error(`Failed to recover item ${item.id} after a save failure:`, recoveryError);
          }
        }
      }
    }

    this.modifiedItems.clear();
  }

  public async applyRule(item: Zotero.Item, rule: Rule<any>, options: any) {
    logger.debug(`Applying ${rule.id}`);
    let ruleFailed = false;
    const sources = new Map<string, string>();
    const journal = new ItemMutationJournal(item);
    const restore = async () => {
      try {
        journal.restore();
      }
      catch (error) {
        this.unsafeItems.add(item);
        this.failedItems.add(item.id || item);
        this.stats.records.push({ itemID: item.id, title: item.getDisplayTitle(), ruleID: rule.id, level: "error", message: getString("rule-rollback-failed") });
        await item.reload(["primaryData", "itemData", "creators", "tags", "collections", "relations"], true);
        throw error;
      }
    };
    try {
      await executeRule(item, async (guardedItem, signal) => {
        let acceptingReports = true;
        const ctx: ApplyContext = {
          item: guardedItem,
          options,
          signal,
          debug: (...a) => createLogger(rule.id).debug(...a),
          report: (info) => {
            if (signal.aborted || !acceptingReports)
              return;
            if (info.level === "error") {
              ruleFailed = true;
              this.failedItems.add(item.id || item);
            }
            if (info.field && info.source)
              sources.set(info.field, info.source);
            this.stats.records.push({
              ...info,
              itemID: item.id,
              title: item.getDisplayTitle(),
              ruleID: rule.id,
            });
          },
        };

        try {
          await rule.apply(ctx);
        }
        finally {
          acceptingReports = false;
        }
      }, rule.timeout ?? 60_000, () => new (Zotero.getMainWindow() as unknown as Window & typeof globalThis).AbortController(), journal.capture);
    }
    catch (error) {
      await restore();
      throw error;
    }
    if (ruleFailed) {
      await restore();
    }
    else {
      for (const change of journal.changes())
        this.changes.push({ ...change, itemID: item.id, ruleID: rule.id, source: sources.get(change.field), saved: false });
    }
  }

  public async applyRuleByID(item: Zotero.Item, ruleID: ID, options: any) {
    return await this.applyRule(item, Rules.getByID(ruleID)!, options);
  }

  // ----------------------------
  // Stats / UI / Finalization
  // ----------------------------

  private updateStats(type: "pass" | "error") {
    this.stats[type]++;
    this.stats.current++;
    this.updateProgress(this.stats.current, this.stats.total);
  }

  private updateProgress(current: number, total: number) {
    const now = Date.now();
    if (this.lastProgressPhase === this.stats.phase && current > 0 && current < total && now - this.lastProgressTime < 100)
      return;
    this.lastProgressTime = now;
    this.lastProgressPhase = this.stats.phase;
    try {
      this.ui.updateProgress(current, total, this.stats.phase);
    }
    catch (error) {
      logger.error("Failed to update batch progress:", error);
    }
  }

  private initStats() {
    this.cancelled = false;
    this.saved = 0;
    this.preparationFailed = 0;
    this.lastProgressTime = 0;
    this.lastProgressPhase = undefined;
    this.failedItems.clear();
    this.changes = [];
    this.savedIDs.clear();
    this.applicableIDs.clear();
    if (!this.stats.startTime)
      this.stats.startTime = Date.now();
    logger.debug(`Add tasks at ${new Date().toLocaleTimeString()}`);
  }

  private finish(silent: boolean) {
    if (this.stats.startTime === this.emptyStats().startTime)
      return;

    const duration = (Date.now() - this.stats.startTime) / 1000;
    const changed = new Set(this.changes.map(change => change.itemID)).size;
    this.lastResult = {
      total: this.stats.total,
      processed: this.stats.current,
      passed: this.stats.current - this.failedItems.size,
      failed: this.failedItems.size,
      saved: this.saved,
      cancelled: this.cancelled,
      skipped: this.stats.total - this.stats.current,
      preparationFailed: this.preparationFailed,
      records: [...this.stats.records],
      changes: this.changes.map(change => ({ ...change, saved: this.savedIDs.has(change.itemID) })),
      changed,
      unchanged: this.stats.current - changed,
      notApplicable: this.stats.current - this.applicableIDs.size,
      warnings: this.stats.records.filter(record => record.level === "warning").length,
    };
    // Release batch state before opening UI, which may fail when a window closes.
    this.modifiedItems.clear();
    DataLoader.clearBatchCache();
    this.stats = this.emptyStats();
    logger.debug(`Batch tasks completed in ${duration}s`);
    if (addon.data.alive) {
      try {
        this.ui.showFinished(this.lastResult.passed, this.lastResult.failed, duration, this.cancelled, this.lastResult.skipped, this.preparationFailed, this.lastResult);
        updateBatchFeedback(this.lastResult);
        if (!silent && getPref("lint.autoReport" as any, false) && this.lastResult.records.length)
          createReporter(this.lastResult.records, this.lastResult.changes).catch(error => logger.error("Failed to display batch report:", error));
      }
      catch (error) {
        logger.error("Failed to display batch results:", error);
      }
    }
  }

  private emptyStats(): RunnerStats {
    return {
      total: 0,
      current: 0,
      pass: 0,
      error: 0,
      startTime: 0,
      records: [],
      phase: "idle",
    };
  }
}
