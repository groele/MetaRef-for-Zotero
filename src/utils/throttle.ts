import pThrottle from "p-throttle";

/**
 * Apply throttle to a function if cooldown is specified and greater than 0.
 * Supports both required and optional functions through function overloading.
 *
 * @param fn - The function to throttle (required or optional)
 * @param cooldown - Cooldown interval in milliseconds
 * @returns The throttled function, or original function if no cooldown
 */
export function withThrottle<T extends (...args: any[]) => any>(
  fn: T,
  cooldown?: number,
  signalFor?: (...args: Parameters<T>) => AbortSignal | undefined,
): T;
export function withThrottle<T extends (...args: any[]) => any>(
  fn: T | undefined,
  cooldown?: number,
  signalFor?: (...args: Parameters<T>) => AbortSignal | undefined,
): T | undefined;
export function withThrottle<T extends (...args: any[]) => any>(
  fn: T | undefined,
  cooldown: number = 0,
  signalFor?: (...args: Parameters<T>) => AbortSignal | undefined,
): T | undefined {
  if (!fn || cooldown <= 0) {
    return fn;
  }

  if (signalFor)
    return withCancellableThrottle(fn, cooldown, signalFor);

  const throttled = pThrottle({
    limit: 1,
    interval: cooldown,
    strict: true,
  });

  return throttled(fn);
}

function withCancellableThrottle<T extends (...args: any[]) => any>(fn: T, cooldown: number, signalFor: (...args: Parameters<T>) => AbortSignal | undefined): T {
  interface Job { args: Parameters<T>; signal?: AbortSignal; resolve: (value: ReturnType<T>) => void; reject: (error: unknown) => void; abort: () => void }
  const queue: Job[] = [];
  let nextStart = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = undefined;
    if (!queue.length)
      return;
    const delay = Math.max(0, nextStart - Date.now());
    if (delay > 0) {
      timer = setTimeout(schedule, delay);
      return;
    }
    const job = queue.shift()!;
    job.signal?.removeEventListener("abort", job.abort);
    if (job.signal?.aborted) {
      job.reject(job.signal.reason);
    }
    else {
      nextStart = Date.now() + cooldown;
      try {
        job.resolve(fn(...job.args));
      }
      catch (error) { job.reject(error); }
    }
    schedule();
  };
  return ((...args: Parameters<T>) => new Promise<ReturnType<T>>((resolve, reject) => {
    const signal = signalFor(...args);
    signal?.throwIfAborted();
    const job: Job = { args, signal, resolve, reject, abort: () => {
      const index = queue.indexOf(job);
      if (index < 0)
        return;
      queue.splice(index, 1);
      signal?.removeEventListener("abort", job.abort);
      reject(signal?.reason);
      schedule();
    } };
    queue.push(job);
    signal?.addEventListener("abort", job.abort, { once: true });
    schedule();
  })) as T;
}
