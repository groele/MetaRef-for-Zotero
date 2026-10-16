import { waitForOperation } from "./rule-execution";

/** A source deadline releases the batch even if a remote adapter ignores cancellation. */
export async function runJournalSource<T>(operation: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal, timeout = 12_000): Promise<T> {
  signal?.throwIfAborted();
  const Controller = typeof AbortController === "undefined"
    ? (Zotero.getMainWindow() as unknown as Window & typeof globalThis).AbortController
    : AbortController;
  const controller = new Controller();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("Journal source deadline exceeded")), timeout);
  try {
    return await waitForOperation(() => operation(controller.signal), controller.signal);
  }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    if (!controller.signal.aborted)
      controller.abort(new Error("Journal source completed"));
  }
}
