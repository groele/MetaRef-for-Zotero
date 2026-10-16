import type { BatchResult } from "./runner";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { preferenceListeners } from "../utils/preference-listeners";
import { createReporter } from "./reporter";

const logger = createLogger("batch-feedback");

export function updateBatchFeedback(result?: BatchResult) {
  const doc = addon.data.prefs?.window.document;
  const status = doc?.getElementById("metaref-last-batch-status");
  const button = doc?.getElementById("metaref-last-batch-report") as HTMLButtonElement | null;
  if (status)
    status.textContent = result ? getString("batch-feedback-summary", { args: { total: result.total, saved: result.saved, failed: result.failed, warnings: result.warnings } }) : getString("batch-feedback-empty");
  if (button)
    button.disabled = !result || (!result.records.length && !result.changes.length);
}

export function setupBatchFeedback(pane: Element) {
  updateBatchFeedback(addon.runner.lastResult);
  const button = pane.querySelector("#metaref-last-batch-report");
  if (button) {
    preferenceListeners(pane)(button, "command", () => {
      const result = addon.runner.lastResult;
      if (result && (result.records.length || result.changes.length))
        void createReporter(result.records, result.changes).catch(error => logger.error(error));
    });
  }
}
