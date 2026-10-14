import { describe, expect, it, vi } from "vitest";
import { cleanupResources, cleanupResourcesSync } from "./cleanup";

describe("independent resource cleanup", () => {
  it("finishes synchronous cleanup before returning even after a host failure", () => {
    const remaining = vi.fn();
    const report = vi.fn();
    cleanupResourcesSync([
      () => { throw new Error("unregister"); },
      remaining,
    ], report);
    expect(remaining).toHaveBeenCalledOnce();
    expect(report).toHaveBeenCalledOnce();
  });
  it("continues after synchronous errors and asynchronous rejections", async () => {
    const order: string[] = [];
    const report = vi.fn();
    await cleanupResources([
      () => {
        order.push("observer");
        throw new Error("host unregister");
      },
      async () => {
        order.push("runner");
        throw new Error("stop");
      },
      () => order.push("locale"),
    ], report);
    expect(order).toEqual(["observer", "runner", "locale"]);
    expect(report).toHaveBeenCalledTimes(2);
  });
});
