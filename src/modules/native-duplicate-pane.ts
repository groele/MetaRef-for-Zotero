import type { NativeDuplicatePlan, NativeDuplicateResult } from "./review/native-duplicates";
import { getString } from "../utils/locale";
import { selectedLibraryIDs } from "../utils/selection";
import { mergeNativeDuplicates, planNativeDuplicates } from "./review/native-duplicates";

const XHTML = "http://www.w3.org/1999/xhtml";
const windows = new Map<Window, () => void>();
let active: AbortController | undefined;

export function registerNativeDuplicatePane(win: Window) {
  windows.get(win)?.();
  const doc = win.document;
  const root = doc.getElementById("zotero-item-pane");
  if (!root)
    return;
  const host = win as Window & typeof globalThis;
  let controller: AbortController | undefined;
  let section: HTMLElement | undefined;
  let feedback: HTMLElement | undefined;
  const mount = () => {
    const native = root.querySelector("#zotero-duplicates-merge-button");
    if (!native || section?.isConnected)
      return;
    section = doc.createElementNS(XHTML, "section") as HTMLElement;
    section.id = "metaref-native-duplicates";
    section.style.cssText = "padding:4px 6px 10px; font:14px system-ui, 'Microsoft YaHei UI', sans-serif; color:var(--fill-primary); overflow-wrap:anywhere; min-width:0";
    const button = doc.createElementNS(XHTML, "button") as HTMLButtonElement;
    button.id = "metaref-native-duplicates-merge-all";
    button.type = "button";
    button.textContent = getString("native-duplicates-merge-all");
    button.style.cssText = "font:inherit; width:100%; white-space:normal; margin:0; min-width:0";
    const status = doc.createElementNS(XHTML, "div") as HTMLDivElement;
    status.id = "metaref-native-duplicates-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.style.cssText = "font-size:13px; line-height:1.6";
    const actions = doc.createElementNS(XHTML, "div") as HTMLDivElement;
    actions.style.cssText = "margin-top:6px";
    const start = doc.createElementNS(XHTML, "button") as HTMLButtonElement;
    start.type = "button";
    start.id = "metaref-native-duplicates-confirm";
    start.textContent = getString("native-duplicates-start");
    const cancel = doc.createElementNS(XHTML, "button") as HTMLButtonElement;
    cancel.type = "button";
    cancel.id = "metaref-native-duplicates-cancel";
    cancel.textContent = getString("duplicates-cancel");
    const dismiss = doc.createElementNS(XHTML, "button") as HTMLButtonElement;
    dismiss.type = "button";
    dismiss.textContent = getString("native-duplicates-dismiss");
    dismiss.style.font = "inherit";
    dismiss.hidden = true;
    dismiss.addEventListener("click", () => feedback?.remove());
    for (const control of [start, cancel])
      control.style.font = "inherit";
    actions.append(start, cancel);
    actions.hidden = true;
    let confirm: ((accepted: boolean) => void) | undefined;
    start.addEventListener("click", () => confirm?.(true));
    cancel.addEventListener("click", () => {
      confirm?.(false);
      controller?.abort();
    });
    const progress = (result: NativeDuplicateResult) => {
      status.textContent = getString(result.cancelled ? "native-duplicates-stopped" : "native-duplicates-progress", { args: { completed: result.completed, total: result.total, merged: result.merged, skipped: result.skipped, failed: result.errors.length } });
      if (result.errors.length)
        status.title = result.errors.join("\n");
    };
    button.addEventListener("click", () => {
      if (active) {
        status.textContent = getString("duplicates-already-running");
        return;
      }
      const libraryIDs = selectedLibraryIDs((win as any).ZoteroPane);
      if (libraryIDs.length !== 1) {
        status.textContent = getString("duplicates-select-one-library");
        return;
      }
      const libraryID = libraryIDs[0];
      controller = new host.AbortController();
      const owner = controller;
      active = owner;
      feedback?.remove();
      feedback = doc.createElementNS(XHTML, "section") as HTMLElement;
      feedback.id = "metaref-native-duplicates-feedback";
      feedback.setAttribute("aria-label", getString("native-duplicates-merge-all"));
      feedback.style.cssText = "padding:10px 12px; color:var(--fill-primary); background:var(--material-background); border-top:1px solid var(--fill-quinary); font:14px system-ui, 'Microsoft YaHei UI', sans-serif; overflow-wrap:anywhere";
      dismiss.hidden = true;
      feedback.append(status, actions, dismiss);
      doc.getElementById("zotero-items-pane")!.append(feedback);
      button.disabled = true;
      status.textContent = getString("native-duplicates-scanning");
      status.removeAttribute("title");
      actions.hidden = false;
      start.hidden = true;
      const abort = () => confirm?.(false);
      owner.signal.addEventListener("abort", abort, { once: true });
      void addon.runner.exclusive(async (signal) => {
        signal.addEventListener("abort", abort, { once: true });
        const plan: NativeDuplicatePlan = await planNativeDuplicates(libraryID, signal);
        signal.throwIfAborted();
        if (!plan.groups.length) {
          status.textContent = getString("native-duplicates-empty");
          return;
        }
        status.textContent = getString("native-duplicates-confirmation", { args: { groups: plan.groups.length, items: plan.groups.reduce((total, group) => total + group.ids.length, 0), strategy: getString(`duplicates-master-${plan.strategy}`) } });
        start.hidden = false;
        const accepted = await new Promise<boolean>(resolve => confirm = resolve);
        signal.removeEventListener("abort", abort);
        confirm = undefined;
        start.hidden = true;
        if (!accepted || signal.aborted) {
          status.textContent = getString("duplicates-cancelled");
          return;
        }
        const nativeButton = native as Element & { disabled: boolean };
        const wasDisabled = nativeButton.disabled;
        nativeButton.disabled = true;
        try {
          await mergeNativeDuplicates(plan, signal, progress);
        }
        finally { nativeButton.disabled = wasDisabled; }
      }, owner.signal).catch((error) => {
        status.textContent = owner.signal.aborted ? getString("duplicates-cancelled") : getString("native-duplicates-error", { args: { error: String(error) } });
        Zotero.debug(`[MetaFlow native duplicate merge] ${String(error)}`);
      }).finally(() => {
        owner.signal.removeEventListener("abort", abort);
        confirm = undefined;
        if (active === owner)
          active = undefined;
        controller = undefined;
        button.disabled = false;
        actions.hidden = true;
        dismiss.hidden = false;
      });
    });
    section.append(button, status, actions);
    native.parentElement!.after(section);
  };
  const observer = new host.MutationObserver(mount);
  observer.observe(root, { childList: true, subtree: true });
  mount();
  windows.set(win, () => {
    controller?.abort();
    observer.disconnect();
    section?.remove();
    feedback?.remove();
  });
}

export function unregisterNativeDuplicatePane(win: Window) {
  windows.get(win)?.();
  windows.delete(win);
}
