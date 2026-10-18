import type { BatchResult } from "./runner";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { preferenceListeners } from "../utils/preference-listeners";
import { getPref } from "../utils/prefs";
import { RUNTIME_HISTORY_BYTES, RUNTIME_HISTORY_LIMIT, RUNTIME_HISTORY_TTL } from "../utils/runtime-data-policy";
import { flushRuntimeData, readRuntimeData, runtimeDataPath } from "../utils/runtime-data-storage";
import { createReporter } from "./reporter";

const logger = createLogger("batch-feedback");

function reportDetails(result: BatchResult) {
  return { records: result.records, changes: result.changes };
}

export function updateBatchFeedback(result?: BatchResult) {
  try {
    renderBatchFeedback(result);
  }
  catch (error) {
    logger.error("Cannot refresh batch feedback", error);
  }
}

function renderBatchFeedback(result?: BatchResult) {
  result ||= addon.runner?.lastResult;
  const active = addon.data.activeCoreWorkflow;
  const doc = addon.data.prefs?.window.document;
  const status = doc?.getElementById("metaref-last-batch-status");
  const button = doc?.getElementById("metaref-last-batch-report") as HTMLButtonElement | null;
  if (status) {
    const workflow = addon.data.lastCoreWorkflow;
    status.textContent = active
      ? coreProgressText()
      : result && workflow?.lastResult === result
        ? coreResultText(result)
        : result ? getString("batch-feedback-summary", { args: { total: result.total, saved: result.saved, failed: result.failed, warnings: result.warnings } }) : getString("batch-feedback-empty");
  }
  if (button) {
    const details = result && reportDetails(result);
    button.disabled = Boolean(active) || !details || (!details.records.length && !details.changes.length);
  }
  updateCoreFeedback();
}

function coreProgressText() {
  const state = addon.data.activeCoreWorkflow!;
  return getString(state.cancelled ? "core-task-stopping" : "core-task-running", { args: { command: getString(`core-task-${state.command}`), stage: getString(`core-task-${state.stage || "preparing"}`), index: state.index, total: state.total } });
}

function coreResultText(result: BatchResult) {
  const stages = addon.data.lastCoreWorkflow?.stages.length || 0;
  return `${getString(result.cancelled ? "core-feedback-cancelled" : result.preparationFailed || result.failed ? "core-feedback-errors" : stages ? "core-feedback-completed" : "core-feedback-empty", { args: { stages } })} ${getString("batch-feedback-summary", { args: { total: result.total, saved: result.saved, failed: result.failed, warnings: result.warnings } })}`;
}

export function closeCoreFeedback() {
  for (const win of Zotero.getMainWindows())
    win.document.getElementById("metaref-core-task")?.remove();
}

export function showCoreCompletionToast(result: BatchResult) {
  if (!getPref("lint.notify"))
    return;
  const outcome = result.cancelled
    ? getString("core-task-stopped")
    : result.failed || result.preparationFailed
      ? getString("core-task-attention")
      : !addon.data.lastCoreWorkflow?.stages.length
          ? getString("core-task-no-stages")
          : getString("core-task-finished");
  const summary = getString("batch-feedback-summary", { args: { total: result.total, saved: result.saved, failed: result.failed, warnings: result.warnings } });
  try {
    new ztoolkit.ProgressWindow(addon.data.config.addonName, { closeOnClick: true, closeTime: 4500 })
      .createLine({ type: result.failed || result.preparationFailed ? "fail" : "default", text: `${outcome} · ${summary}`, progress: 100, idx: 0 })
      .show();
  }
  catch (error) {
    logger.error("Cannot show core workflow completion toast", error);
  }
}

/** Keep the stop control inline while a complete command is running. */
function updateCoreFeedback() {
  const state = addon.data.activeCoreWorkflow;
  if (!state) {
    closeCoreFeedback();
    return;
  }
  for (const win of Zotero.getMainWindows()) {
    const doc = win.document;
    const host = doc.getElementById("zotero-items-pane");
    if (!host)
      continue;
    let panel = doc.getElementById("metaref-core-task");
    if (!panel) {
      panel = ztoolkit.UI.createElement(doc, "section", {
        properties: { id: "metaref-core-task" },
        attributes: { "aria-label": addon.data.config.addonName },
        styles: { flex: "0 0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "8px 12px", borderTop: "1px solid var(--fill-quinary)", background: "var(--material-background)", color: "var(--fill-primary)", fontSize: "13px" },
      });
      panel.append(ztoolkit.UI.createElement(doc, "span", { properties: { id: "metaref-core-task-status" }, attributes: { "role": "status", "aria-live": "polite" }, styles: { flex: "1 1 220px", overflowWrap: "anywhere" } }));
      panel.append(ztoolkit.UI.createElement(doc, "button", { properties: { id: "metaref-core-task-action" }, attributes: { type: "button" } }));
      host.append(panel);
    }
    const status = panel.querySelector<HTMLSpanElement>("#metaref-core-task-status")!;
    status.textContent = `${addon.data.config.addonName} · ${coreProgressText()}`;
    status.title = coreProgressText();
    const action = panel.querySelector<HTMLButtonElement>("#metaref-core-task-action")!;
    action.textContent = getString("core-task-stop");
    action.disabled = state.cancelled;
    action.onclick = () => {
      addon.data.activeCoreWorkflow?.cancel();
      updateBatchFeedback();
    };
  }
}

export function setupBatchFeedback(pane: Element) {
  const policy = pane.querySelector("#metaref-runtime-data-policy");
  if (policy)
    policy.textContent = getString("runtime-data-policy", { args: { days: RUNTIME_HISTORY_TTL / 86_400_000, count: RUNTIME_HISTORY_LIMIT, size: RUNTIME_HISTORY_BYTES / 1024 / 1024 } });
  const report = pane.querySelector("#metaref-last-batch-report");
  if (report && !pane.querySelector("#metaref-runtime-data-open")) {
    const open = ztoolkit.UI.createElement(pane.ownerDocument!, "button", { attributes: { type: "button" }, properties: { id: "metaref-runtime-data-open", textContent: getString("runtime-data-open") } });
    report.after(open);
    preferenceListeners(pane)(open, "click", async () => {
      try {
        await readRuntimeData();
        await flushRuntimeData();
        await Zotero.File.reveal(runtimeDataPath());
      }
      catch (error) { logger.error("Cannot open runtime data", error); }
    });
  }

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
