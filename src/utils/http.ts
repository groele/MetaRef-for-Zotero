import { abortableDelay, waitForOperation } from "./rule-execution";

type RequestOptions = NonNullable<Parameters<typeof Zotero.HTTP.request>[2]>;

interface CachedRequest {
  promise: ReturnType<typeof requestGET>;
  controller: AbortController;
  users: number;
  settled: boolean;
  expires: number;
}
const publicRequests = new Map<string, CachedRequest>();

export function clearRequestCache() {
  for (const entry of publicRequests.values()) {
    if (!entry.settled)
      entry.controller.abort(new Error("Request cache cleared"));
  }
  publicRequests.clear();
}

/** Share public lookups only; authenticated metadata services never use this cache. */
export async function requestCachedGET(url: string, options: RequestOptions = {}, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (options.headers && Object.keys(options.headers).length)
    return requestGET(url, options, signal);
  const key = JSON.stringify([url, options.responseType || "text"]);
  let entry = publicRequests.get(key);
  if (!entry || entry.expires <= Date.now()) {
    const controller = new (Zotero.getMainWindow() as unknown as Window & typeof globalThis).AbortController();
    const created: CachedRequest = { controller, users: 0, settled: false, expires: Number.POSITIVE_INFINITY, promise: requestGET(url, options, controller.signal) };
    created.promise = created.promise.then((result) => {
      created.settled = true;
      created.expires = Date.now() + 300_000;
      return result;
    }, (error) => {
      if (publicRequests.get(key) === created)
        publicRequests.delete(key);
      throw error;
    });
    publicRequests.set(key, created);
    if (publicRequests.size > 128)
      publicRequests.delete(publicRequests.keys().next().value!);
    entry = created;
  }
  const current = entry;
  current.users++;
  try {
    return await (signal ? waitForOperation(() => current.promise, signal) : current.promise);
  }
  finally {
    current.users--;
    if (!current.users && !current.settled) {
      current.controller.abort(new Error("All request subscribers cancelled"));
      if (publicRequests.get(key) === current)
        publicRequests.delete(key);
    }
  }
}

/** Bound public API requests and connect the rule deadline to Gecko's canceller. */
export async function requestGET(url: string, options: RequestOptions = {}, signal?: AbortSignal) {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    let abort: (() => void) | undefined;
    try {
      const response = await Zotero.HTTP.request("GET", url, {
        timeout: 15_000,
        ...options,
        cancellerReceiver(cancel: () => void) {
          abort = cancel;
          if (signal?.aborted)
            cancel();
          else
            signal?.addEventListener("abort", cancel, { once: true });
          options.cancellerReceiver?.(cancel);
        },
      });
      signal?.throwIfAborted();
      return response;
    }
    catch (error) {
      signal?.throwIfAborted();
      const response = error as { status?: number; xmlhttp?: XMLHttpRequest };
      if (attempt || ![429, 503].includes(response.status || 0))
        throw error;
      const retryAfter = response.xmlhttp?.getResponseHeader?.("Retry-After");
      const seconds = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined;
      const wait = seconds !== undefined ? seconds * 1000 : retryAfter ? Date.parse(retryAfter) - Date.now() : 1000;
      // Respect long server backoffs by returning the error, rather than retrying early.
      if (!Number.isFinite(wait) || wait > 5000)
        throw error;
      await abortableDelay(Math.max(0, wait), signal);
    }
    finally {
      if (abort)
        signal?.removeEventListener("abort", abort);
    }
  }
}
