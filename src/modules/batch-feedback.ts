import type { BatchResult } from "./runner";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { preferenceListeners } from "../utils/preference-listeners";
import { RUNTIME_HISTORY_BYTES, RUNTIME_HISTORY_LIMIT, RUNTIME_HISTORY_TTL } from "../utils/runtime-data-policy";
import { flushRuntimeData, readRuntimeData, runtimeDataPath } from "../utils/runtime-data-storage";
import { createReporter } from "./reporter";

const logger = createLogger("batch-feedback");
const dismissed = new WeakSet<BatchResult>();

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
  updateCoreFeedback(result);
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

/** One quiet, inline surface for the complete command; no intermediate report windows. */
function updateCoreFeedback(result?: BatchResult) {
  const state = addon.data.activeCoreWorkflow;
  const completed = result && addon.data.lastCoreWorkflow?.lastResult === result;
  if (!state && (!completed || dismissed.has(result!))) {
    if (addon.data.lastCoreWorkflow)
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
      panel.append(ztoolkit.UI.createElement(doc, "button", { properties: { id: "metaref-core-task-dismiss", textContent: getString("core-task-dismiss"), onclick: () => {
        const latest = addon.data.lastCoreWorkflow?.lastResult;
        if (latest)
          dismissed.add(latest);
        closeCoreFeedback();
      } }, attributes: { type: "button" } }));
      host.append(panel);
    }
    const status = panel.querySelector<HTMLSpanElement>("#metaref-core-task-status")!;
    const outcome = state ? "" : getString(result!.cancelled ? "core-task-stopped" : result!.failed || result!.preparationFailed ? "core-task-attention" : !addon.data.lastCoreWorkflow?.stages.length ? "core-task-no-stages" : "core-task-finished");
    status.textContent = `${addon.data.config.addonName} · ${state ? coreProgressText() : getString("core-task-result", { args: { outcome, saved: result!.saved, total: result!.total } })}`;
    status.title = state ? coreProgressText() : coreResultText(result!);
    const action = panel.querySelector<HTMLButtonElement>("#metaref-core-task-action")!;
    action.textContent = getString(state ? "core-task-stop" : "core-task-details");
    action.disabled = state ? state.cancelled : !result?.records.length && !result?.changes.length;
    action.onclick = () => {
      if (addon.data.activeCoreWorkflow) {
        addon.data.activeCoreWorkflow.cancel();
        updateBatchFeedback();
      }
      else if (result) {
        action.disabled = true;
        void createReporter(result.records, result.changes).catch(error => logger.error(error)).finally(() => {
          if (action.isConnected)
            action.disabled = false;
        });
      }
    };
    (panel.querySelector("#metaref-core-task-dismiss") as HTMLButtonElement).hidden = Boolean(state);
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
