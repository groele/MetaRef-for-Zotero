import type { ProgressWindowHelper, TagElementProps } from "zotero-plugin-toolkit";
import { groupBy } from "es-toolkit";
import { useDialog } from "../utils/dialog";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { getPref } from "../utils/prefs";
import { waitUtilAsync } from "../utils/wait";
import { Rules } from "./rules";

export interface FieldChange {
  itemID: number;
  ruleID: string;
  field: string;
  before: unknown;
  after: unknown;
  source?: string;
  saved: boolean;
}

export interface ReportInfo {
  code?: string;
  level?: "info" | "warning" | "error";
  label?: string;
  message: string;
  action?: {
    label: string;
    callback: () => void | Promise<void>;
  };
  itemID: number;
  title: string;
  ruleID: string;
  field?: string;
  source?: string;
}

export function createReporter(infos: ReportInfo[], changes: FieldChange[] = []) {
  const resolvedInfos: Record<number, ReportInfo[]> = groupBy(
    infos,
    info => info.itemID,
  );

  const { dialog, openAndWaitClose, close } = useDialog(new ztoolkit.Dialog(1, 1));
  dialog.addCell(0, 0, {
    tag: "div",
    styles: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      fontFamily: "Segoe UI, sans-serif",
      fontSize: "14px",
    },
    children: [{
      tag: "button",
      properties: {
        id: "metaref-report-export",
        textContent: getString("report-export"),
        onclick: async (event: Event) => {
          const button = event.currentTarget as HTMLButtonElement;
          button.disabled = true;
          try {
            const path = await new ztoolkit.FilePicker(getString("report-export"), "save", [["JSON", "*.json"]], "metaflow-report.json").open();
            if (path)
              await Zotero.File.putContentsAsync(path, JSON.stringify({ reports: infos.map(({ action, ...info }) => info), changes }, null, 2));
          }
          catch (error) {
            button.textContent = getString("report-export-failed");
            createLogger("reporter").error("Report export failed:", error);
          }
          finally {
            button.disabled = false;
          }
        },
      },
    }, ...Object.values(resolvedInfos).flatMap(infos => [
      {
        tag: "div",
        styles: {
          border: "var(--material-border)",
          borderRadius: "8px",
          padding: "10px",
          backgroundColor: "var(--material-background)",
        },
        children: [
          {
            tag: "a",
            properties: {
              textContent: infos[0].itemID ? `${infos[0].itemID} - ${infos[0].title}` : infos[0].title,
            },
            styles: {
              fontWeight: "bold",
              marginBottom: "8px",
              display: "block",
              fontSize: "15px",
              color: "var(--fill-primary)",
              textDecoration: "none",
            },
            listeners: [
              {
                type: "click",
                listener: () => {
                  if (infos[0].itemID)
                    Zotero.getActiveZoteroPane()?.selectItem(infos[0].itemID);
                },
              },
            ],
          },
          ...infos.map(createRuleResultRows),
          ...changes.filter(change => change.itemID === infos[0].itemID).map(change => ({
            tag: "details",
            children: [{ tag: "summary", properties: { textContent: `${change.field}${change.source ? ` · ${change.source}` : ""}` } }, {
              tag: "pre",
              properties: { textContent: JSON.stringify({ before: change.before, after: change.after, saved: change.saved }, null, 2) },
              styles: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
            }],
          } satisfies TagElementProps)),
        ],
      },
    ] satisfies TagElementProps[])],
  });

  function createRuleResultRows(info: ReportInfo): TagElementProps {
    return {
      tag: "div",
      styles: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        borderRadius: "6px",
        minHeight: "2rem",
        backgroundColor:
          info.level === "info"
            ? "transparent"
            : info.level === "error"
              ? "rgba(255, 0, 0, 0.08)"
              : "rgba(255, 165, 0, 0.08)",
        marginBottom: "6px",
      },
      children: [
        {
          tag: "a",
          properties: {
            textContent: info.label ?? (Rules.getByID(info.ruleID as ID) ? getString((Rules.getByID(info.ruleID as ID)!.nameKey || `rule-${info.ruleID}`) as Parameters<typeof getString>[0], "label") : info.ruleID),
          // href: `https://github.com/groele/Zotero-MetaFlow/blob/main/docs/rules/${info.ruleID}.md`,
          },
          styles: {
            fontWeight: "bold",
            color: info.level === "info" ? "var(--fill-primary)" : info.level === "error" ? "var(--accent-red)" : "var(--accent-orange)",
            minWidth: "80px",
            textDecoration: "none",
          },
        },
        {
          tag: "label",
          properties: {
            textContent: info.message,
          },
          styles: {
            flex: "1",
            color: "var(--fill-primary)",
            fontSize: "13px",
            lineHeight: "1.4",
            whiteSpace: "pre-line",
          },
        },
        {
          tag: "button",
          styles: {
            display: info.action ? "inline-block" : "none",
            padding: "4px 10px",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
          },
          properties: {
            textContent: info.action?.label,
            onclick: async () => {
              try {
                await info.action?.callback();
              }
              catch (error) {
                createLogger("reporter").error("Report action failed:", error);
                return;
              }

              // If only one rule reports an issue for an item,
              // close the dialog when clicking the button
              if (infos.length === 1) {
                close();
              }
            },
          },
        },
      ],
    };
  }

  return openAndWaitClose(addon.data.config.addonName);
}

const SUCCESS_CLOSE_DELAY = 1500;

export class ProgressUI {
  private progressWindow?: ProgressWindowHelper;
  private _onCancel?: () => void;
  private running = false;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor(options?: { onCancel?: () => void }) {
    this._onCancel = options?.onCancel;
  }

  public close(): void {
    clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
    this.progressWindow?.close();
    this.progressWindow = undefined;
    this.running = false;
  }

  public async init(slient?: boolean): Promise<void> {
    this.close();

    if (slient || !getPref("lint.notify"))
      return;

    this.running = true;
    this.progressWindow = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
      closeOnClick: false,
      closeTime: -1,
    })
      .createLine({
        type: "default",
        text: getString("info-batch-init"),
        progress: 0,
        idx: 0,
      })
      .createLine({
        type: "default",
        text: getString("info-batch-pending-save"),
        progress: 0,
        idx: 1,
      })
      .createLine({
        text: getString("info-batch-break"),
        idx: 2,
      })
      .show();

    // @ts-expect-error miss types
    await waitUtilAsync(() => Boolean(this.progressWindow?.lines?.[2]?._itemText));
    // @ts-expect-error miss types
    const stopLine = this.progressWindow?.lines?.[2];
    if (stopLine?._hbox) {
      stopLine._hbox.addEventListener("click", this.handleStopRequest);
    }
  }

  public updateProgress(current: number, total: number, phase?: "idle" | "linting" | "saving"): void {
    if (!this.progressWindow)
      return;

    const progress = total > 0 ? (current / total) * 100 : 100;

    if (phase === "saving") {
      this.progressWindow.changeLine({
        text: `[${current}/${total}] ${getString("info-batch-saving")}`,
        progress,
        idx: 1,
      });
    }
    else {
      const label = phase === "idle"
        ? getString("info-batch-init")
        : getString("info-batch-running");
      const text = phase === "idle" ? label : `[${current}/${total}] ${label}`;
      this.progressWindow.changeLine({ text, progress, idx: 0 });
    }
  }

  public showError(): void {
    this.progressWindow?.createLine({
      type: "fail",
      text: getString("info-batch-has-error"),
    });
  }

  public showFinished(successCount: number, errorCount: number, duration: number, cancelled = false, skipped = 0, preparationFailed = 0, details?: { saved: number; unchanged: number; notApplicable: number; warnings: number }): void {
    if (!this.progressWindow)
      return;

    this.running = false;
    const closeDelay = errorCount || preparationFailed ? 6000 : cancelled ? 2500 : details?.warnings ? 4000 : SUCCESS_CLOSE_DELAY;
    const text = cancelled
      ? getString("info-batch-cancelled", { args: { processed: successCount + errorCount, skipped } })
      : successCount + errorCount
        ? [
            "[",
            `✔️${successCount}`,
            errorCount ? ` ❌${errorCount}` : "",
            "] ",
            getString("info-batch-finish"),
          ].join("")
        : getString(preparationFailed ? "info-batch-has-error" : "info-batch-no-selected");

    this.progressWindow
      .changeLine({ text, progress: 100, idx: 0 })
      .changeLine({ text: details ? getString("info-batch-details", { args: details }) : "", progress: 100, idx: 1 })
      .changeLine({ text: getString("info-batch-duration", { args: { seconds: duration.toFixed(1) } }), idx: 2 });
    clearTimeout(this.closeTimer);
    const completedWindow = this.progressWindow;
    this.closeTimer = setTimeout(() => {
      if (this.progressWindow === completedWindow)
        this.close();
    }, closeDelay);
    if (preparationFailed && successCount + errorCount)
      this.showError();
  }

  private handleStopRequest = (ev: MouseEvent): void => {
    if (!this.running) {
      this.close();
      return;
    }
    ev.stopPropagation();
    ev.preventDefault();
    this.progressWindow?.changeLine({
      text: getString("info-batch-stop-next"),
      idx: 2,
    });
    this._onCancel?.();
  };
}
