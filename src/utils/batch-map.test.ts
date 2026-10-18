import { describe, expect, it, vi } from "vitest";
import { mapBatch } from "./batch-map";

describe("bounded preparation batches", () => {
  it("preserves input order and never exceeds configured concurrency", async () => {
    let active = 0;
    let maximum = 0;
    const result = await mapBatch([0, 1, 2, 3, 4, 5], 3, async (value) => {
      maximum = Math.max(maximum, ++active);
      await Promise.resolve();
      active--;
      return value * 2;
    });
    expect(result).toEqual([0, 2, 4, 6, 8, 10]);
    expect(maximum).toBe(3);
  });

  it("rejects pre-cancelled work without invoking the visitor", async () => {
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    const visit = vi.fn();
    await expect(mapBatch([1], 4, visit, controller.signal)).rejects.toThrow("cancelled");
    expect(visit).not.toHaveBeenCalled();
  });

  it("drains already-started siblings before rejecting and starts no further work", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => release = resolve);
    const visited: number[] = [];
    let settled = false;
    const result = mapBatch([0, 1, 2, 3], 2, async (value) => {
      visited.push(value);
      if (value === 0)
        throw new Error("failed");
      await gate;
      return value;
    });
    const rejection = expect(result).rejects.toThrow("failed");
    void result.finally(() => settled = true).catch(() => {});
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    release();
    await rejection;
    expect(visited).toEqual([0, 1]);
    expect(settled).toBe(true);
  });

  it("yields to the event loop during a large immediately cached batch", async () => {
    let ticked = false;
    const timer = setTimeout(() => ticked = true, 0);
    const values = Array.from({ length: 2000 }, (_, index) => index);
    try {
      expect(await mapBatch(values, 4, async value => value)).toEqual(values);
      expect(ticked).toBe(true);
    }
    finally { clearTimeout(timer); }
  });

  it("handles an empty batch and normalizes invalid concurrency", async () => {
    expect(await mapBatch([], 0, async value => value)).toEqual([]);
    expect(await mapBatch([1, 2], Number.NaN, async value => value)).toEqual([1, 2]);
  });
});
