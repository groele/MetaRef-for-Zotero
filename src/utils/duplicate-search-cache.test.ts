import { afterEach, expect, it, vi } from "vitest";
import { cachedDuplicateSearch, clearDuplicateSearchCache } from "./duplicate-search-cache";

afterEach(clearDuplicateSearchCache);

it("shares an unchanged library scan but invalidates on item notifications", async () => {
  const search = vi.fn(async () => new Set([1, 2]));
  const first = cachedDuplicateSearch(1, search);
  const concurrent = cachedDuplicateSearch(1, search);
  expect(first).toBe(concurrent);
  await Promise.all([first, concurrent]);
  await cachedDuplicateSearch(1, search);
  expect(search).toHaveBeenCalledOnce();
  clearDuplicateSearchCache();
  await cachedDuplicateSearch(1, search);
  expect(search).toHaveBeenCalledTimes(2);
});

it("does not retain failures or restore an invalidated in-flight scan", async () => {
  const fail = vi.fn(async (): Promise<Set<number>> => Promise.reject(new Error("Scan failed")));
  await expect(cachedDuplicateSearch(1, fail)).rejects.toThrow("Scan failed");
  const next = vi.fn(async () => new Set([3]));
  await cachedDuplicateSearch(1, next);
  expect(next).toHaveBeenCalledOnce();
  clearDuplicateSearchCache();
  let finish!: (ids: Set<number>) => void;
  const slow = cachedDuplicateSearch(1, () => new Promise(resolve => finish = resolve));
  clearDuplicateSearchCache();
  finish(new Set([1]));
  await slow;
  await cachedDuplicateSearch(1, next);
  expect(next).toHaveBeenCalledTimes(2);
});
