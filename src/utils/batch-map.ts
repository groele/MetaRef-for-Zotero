import { normalizedConcurrency } from "./rule-execution";

/** Preserve input order, drain started work, and yield during large cached batches. */
export async function mapBatch<T, R>(values: readonly T[], concurrency: number, visit: (value: T, index: number) => Promise<R>, signal?: AbortSignal): Promise<R[]> {
  signal?.throwIfAborted();
  const results: R[] = [];
  let next = 0;
  let completed = 0;
  let failed = false;
  const worker = async () => {
    while (!failed && next < values.length) {
      signal?.throwIfAborted();
      const index = next++;
      try {
        results[index] = await visit(values[index], index);
      }
      catch (error) {
        failed = true;
        throw error;
      }
      if (++completed % 64 === 0)
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  };
  const settled = await Promise.allSettled(Array.from({ length: Math.min(values.length, normalizedConcurrency(concurrency)) }, worker));
  const failure = settled.find(result => result.status === "rejected");
  if (failure?.status === "rejected")
    throw failure.reason;
  signal?.throwIfAborted();
  return results;
}
