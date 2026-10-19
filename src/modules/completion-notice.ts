import type { ProgressWindowHelper } from "zotero-plugin-toolkit";
import { getString } from "../utils/locale";
import { createLogger } from "../utils/logger";
import { waitUtilAsync } from "../utils/wait";

const notices = new Set<() => void>();
const logger = createLogger("completion-notice");
export const COMPLETION_NOTICE_MS = 5000;

export function closeCompletionNotices() {
  for (const close of notices)
    close();
}

/** Keep native bottom-right positioning, with a fixed lifetime and an explicit report action. */
export async function configureCompletionNotice(helper: ProgressWindowHelper, openReport: () => Promise<void>) {
  const parent = Zotero.getMainWindow();
  closeCompletionNotices();
  const lines = (helper as unknown as { lines: { _itemText?: Element }[] }).lines;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const close = () => {
    if (closed)
      return;
    closed = true;
    clearTimeout(timer);
    parent.removeEventListener("unload", close);
    notices.delete(close);
    helper.close();
  };
  notices.add(close);
  try {
    await waitUtilAsync(() => closed || Boolean(lines[0]?._itemText), 25);
    if (closed)
      return;
    const win = lines[0]._itemText!.ownerDocument!.defaultView!;
    // Native sizeToContent can settle asynchronously under Linux window managers.
    const tile = () => {
      if (!closed && !win.closed)
        (Zotero.ProgressWindowSet as typeof Zotero.ProgressWindowSet & { tile: (window: Window) => void }).tile(win);
    };
    win.addEventListener("resize", tile);
    helper.addDescription(getString("completion-notice-open"));
    win.requestAnimationFrame(tile);
    win.document.documentElement!.setAttribute("data-metaref-completion", "true");
    (win.document.documentElement as HTMLElement).style.cursor = "pointer";
    const open = () => {
      if (closed)
        return;
      close();
      if (addon.data.alive)
        void openReport().catch(error => logger.error("Cannot open completion report", error));
    };
    win.addEventListener("mouseup", (event) => {
      if ((event as MouseEvent).button === 0)
        open();
    });
    const content = win.document.getElementById("zotero-progress-text-box")!;
    content.setAttribute("role", "button");
    content.setAttribute("tabindex", "0");
    content.setAttribute("aria-label", getString("completion-notice-open"));
    content.addEventListener("keydown", (event: Event) => {
      if (["Enter", " "].includes((event as KeyboardEvent).key)) {
        event.preventDefault();
        open();
      }
    });
    win.addEventListener("unload", close, { once: true });
    parent.addEventListener("unload", close, { once: true });
    timer = setTimeout(close, COMPLETION_NOTICE_MS);
  }
  catch (error) {
    close();
    logger.error("Cannot configure completion notification", error);
  }
}
