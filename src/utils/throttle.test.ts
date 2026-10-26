import { afterEach, describe, expect, it, vi } from "vitest";
import { withThrottle } from "./throttle";

afterEach(() => vi.useRealTimers());

describe("api cooldown", () => {
  it("rejects cancelled queued requests promptly and does not spend cooldown slots on them", async () => {
    vi.useFakeTimers();
    const starts: string[] = [];
    const throttled = withThrottle(async (name: string, _signal?: AbortSignal) => {
      starts.push(name);
    }, 100, (_name, signal) => signal);
    await throttled("first");
    const controller = new AbortController();
    let cancelled = false;
    const abandoned = throttled("abandoned", controller.signal).catch(() => {
      cancelled = true;
    });
    const next = throttled("next");
    controller.abort(new Error("User cancelled"));
    await Promise.resolve();
    expect(cancelled).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([abandoned, next]);
    expect(starts).toEqual(["first", "next"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes every cancelled queued timer while respecting the preceding active call", async () => {
    vi.useFakeTimers();
    const apply = vi.fn(async (_signal?: AbortSignal) => {});
    const throttled = withThrottle(apply, 100, signal => signal);
    await throttled();
    const controller = new AbortController();
    const pending = Array.from({ length: 30 }, () => throttled(controller.signal).catch(error => error));
    controller.abort(new Error("Shutdown"));
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
    await Promise.all(pending);
    await vi.advanceTimersByTimeAsync(50);
    const next = throttled();
    await vi.advanceTimersByTimeAsync(50);
    await next;
    expect(apply).toHaveBeenCalledTimes(2);
  });
  it("spaces calls by the full cooldown under concurrent load", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T00:00:00Z"));
    const starts: number[] = [];
    const throttled = withThrottle(async () => {
      starts.push(Date.now());
    }, 100);
    const pending = Promise.all([throttled(), throttled(), throttled()]);
    await vi.advanceTimersByTimeAsync(0);
    expect(starts).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(99);
    expect(starts).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(101);
    await pending;
    expect(starts.map(time => time - starts[0])).toEqual([0, 100, 200]);
  });

  it("keeps local rules synchronous when cooldown is disabled", () => {
    const apply = vi.fn(() => "done");
    expect(withThrottle(apply, 0)).toBe(apply);
    expect(withThrottle(undefined, 0)).toBeUndefined();
  });
});
