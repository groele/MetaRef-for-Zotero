import type { CoreCommand, CoreStage } from "../utils/core-workflow";
import type { BatchResult } from "./runner";
import { coreWorkflowPlan, executeCorePlan } from "../utils/core-workflow";
import { getJournalInsights } from "../utils/journal-insights";
import { hasEnabledJournalMetrics } from "../utils/journal-permissions";
import { getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
import { REMOTE_STANDARD_RULES } from "../utils/workflow-policy";
import { updateBatchFeedback } from "./batch-feedback";
import { refreshJournalPane, setJournalUpdateResult } from "./journal-pane";
import { runReviewCommand } from "./review";
import { Rules } from "./rules";
import { ToolUpdateEasyScholar } from "./rules/tool-update-easyscholar";

export function localDOICheck() {
  return {
    ...Rules.getByID("require-doi")!,
    cooldown: 0,
    apply({ item, report }: Parameters<typeof ToolUpdateEasyScholar.apply>[0]) {
      if (!item.getField("DOI") && !ztoolkit.ExtraField.getExtraField(item, "DOI")) {
        report({ level: "warning", message: getString("workflow-missing-doi"), action: { label: getString("rule-tool-update-metadata-menu-item"), callback: async () => {
          const current = Zotero.Items.get(item.id);
          if (current && !current.deleted)
            await addon.hooks.onLintInBatch("tool-update-metadata", [current], { review: true });
        } } });
      }
    },
  };
}

const pending = new Map<string, Promise<BatchResult | undefined>>();

export function runCoreWorkflow(command: CoreCommand, items: Zotero.Item[]) {
  const key = `${command}:${items.map(item => item.id).sort((a, b) => a - b).join(",")}`;
  const existing = pending.get(key);
  if (existing)
    return existing;
  const task = executeWorkflow(command, items).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}

async function executeWorkflow(command: CoreCommand, items: Zotero.Item[]) {
  if (!items.length)
    return;
  const pref = (key: string, fallback: boolean) => getPref(key as any, fallback) === true;
  const options = {
    checkMetadata: pref("workflow.updateMetadata", false),
    checkAuthors: pref("workflow.remoteAuthorsOnCheck", false),
    checkJournal: pref("workflow.updateJournalRankings", false),
    checkDuplicates: pref("workflow.reviewDuplicatesOnCheck", false),
    updateMetadata: pref("workflow.updateBibliographic", true),
    updateFormat: pref("workflow.formatAfterUpdate", true),
    updateJournal: pref("metadata.updateJournalInfo", true),
    updateDuplicates: pref("workflow.reviewDuplicatesOnUpdate", false),
  };
  const stages: { stage: CoreStage; result: BatchResult }[] = [];
  const run = async (stage: CoreStage) => {
    const current = items.filter(item => !item.deleted && item.isEditable());
    if (!current.length)
      return;
    if (stage === "metadata" || stage === "authors") {
      return runReviewCommand("tool-review-metadata", current, command === "update" && stage === "metadata" && pref("workflow.updateVersions", false), {
        scanPDF: pref("workflow.scanPDF", false),
        searchTitle: pref("workflow.searchTitle", false),
        creatorsOnly: stage === "authors",
        repairCreators: stage === "authors" || (command === "check" && options.checkAuthors) || pref("metadata.repairCreators", true),
        overwrite: command === "update" && getPref("rule.tool-update-metadata.option.mode") === "all",
      });
    }
    if (stage === "format") {
      const skipDuplicates = command === "update" || options.checkDuplicates;
      const rules = Rules.getEnabledStandard().filter(rule => !REMOTE_STANDARD_RULES.has(rule.id) && !(skipDuplicates && rule.id === "no-item-duplication"));
      if (pref("rule.require-doi", true))
        rules.push(localDOICheck());
      if (rules.length)
        return addon.runner.add({ items: current, rules, silent: command === "update" });
    }
    if (stage === "journal" && hasEnabledJournalMetrics()) {
      const journals = current.filter(item => ["journalArticle", "conferencePaper"].includes(item.itemType));
      if (!journals.length)
        return;
      const mode = command === "update" && getPref("rule.tool-update-metadata.option.mode") === "all" ? "all" : "blank";
      const result = await addon.runner.add({ items: journals, rules: [{ ...ToolUpdateEasyScholar, prepare: () => ({ mode }) }], silent: true });
      if (addon.data.alive && !result?.cancelled) {
        await Promise.all(journals.filter(item => !item.deleted && item.itemType === "journalArticle").map(item => getJournalInsights(item, { queryAPI: true })));
        Zotero.ItemTreeManager.refreshColumns();
        setJournalUpdateResult(journals.map(item => item.id), result);
        await refreshJournalPane(journals.map(item => item.id));
      }
      return result;
    }
    if (stage === "duplicates")
      return runReviewCommand("tool-review-duplicates", current);
  };
  const latest = await executeCorePlan(coreWorkflowPlan(command, options), async (stage) => {
    const result = await run(stage);
    if (result)
      stages.push({ stage, result });
    return result;
  }, () => addon.data.alive);
  if (latest && addon.data.alive) {
    addon.data.lastCoreWorkflow = { lastResult: latest, stages };
    updateBatchFeedback(addon.runner.lastResult);
  }
  return latest;
}
