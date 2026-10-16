import { afterEach, expect, it, vi } from "vitest";
import { runJournalSource } from "./journal-source";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("releases an uncooperative source at its own deadline and aborts its signal", async () => {
  vi.useFakeTimers();
  let sourceSignal!: AbortSignal;
  const result = runJournalSource(async (signal) => {
    sourceSignal = signal;
    return new Promise(() => {});
  }, undefined, 50);
  const check = expect(result).rejects.toThrow("Journal source deadline exceeded");
  await vi.advanceTimersByTimeAsync(50);
  await check;
  expect(sourceSignal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it("propagates batch cancellation and removes the pending source deadline", async () => {
  vi.useFakeTimers();
  const parent = new AbortController();
  const result = runJournalSource(async () => new Promise(() => {}), parent.signal);
  const check = expect(result).rejects.toThrow("batch cancelled");
  parent.abort(new Error("batch cancelled"));
  await check;
  expect(vi.getTimerCount()).toBe(0);
});

it("uses the host window controller when the plugin sandbox has no global constructor", async () => {
  const HostController = AbortController;
  vi.stubGlobal("AbortController", undefined);
  vi.stubGlobal("Zotero", { getMainWindow: () => ({ AbortController: HostController }) });
  expect(await runJournalSource(async () => 42)).toBe(42);
});
