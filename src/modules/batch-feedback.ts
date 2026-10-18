import type { BatchResult } from "./runner";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { preferenceListeners } from "../utils/preference-listeners";
import { createReporter } from "./reporter";

const logger = createLogger("batch-feedback");

function reportDetails(result: BatchResult) {
  const workflow = addon.data.lastCoreWorkflow;
  const results = workflow?.lastResult === result ? workflow.stages.map(stage => stage.result) : [result];
  return { records: results.flatMap(result => result.records), changes: results.flatMap(result => result.changes) };
}

export function updateBatchFeedback(result?: BatchResult) {
  const doc = addon.data.prefs?.window.document;
  const status = doc?.getElementById("metaref-last-batch-status");
  const button = doc?.getElementById("metaref-last-batch-report") as HTMLButtonElement | null;
  if (status) {
    const workflow = addon.data.lastCoreWorkflow;
    status.textContent = result && workflow?.lastResult === result
      ? getString(result.cancelled ? "core-feedback-cancelled" : "core-feedback-completed", { args: { stages: workflow.stages.length } })
      : result ? getString("batch-feedback-summary", { args: { total: result.total, saved: result.saved, failed: result.failed, warnings: result.warnings } }) : getString("batch-feedback-empty");
  }
  if (button) {
    const details = result && reportDetails(result);
    button.disabled = !details || (!details.records.length && !details.changes.length);
  }
}

export function setupBatchFeedback(pane: Element) {
  updateBatchFeedback(addon.runner.lastResult);
  const button = pane.querySelector("#metaref-last-batch-report");
  if (button) {
    preferenceListeners(pane)(button, "command", () => {
      const result = addon.runner.lastResult;
      const details = result && reportDetails(result);
      if (details && (details.records.length || details.changes.length))
        void createReporter(details.records, details.changes).catch(error => logger.error(error));
    });
  }
}
