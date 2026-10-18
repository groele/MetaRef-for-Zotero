import { afterEach, expect, it, vi } from "vitest";
import { registerPersistenceShutdown } from "./persistence-shutdown";

afterEach(() => vi.unstubAllGlobals());

it("registers and removes the same shutdown callback without invoking it early", () => {
  const phase = { addBlocker: vi.fn(), removeBlocker: vi.fn() };
  const flush = vi.fn(async () => {});
  const unregister = registerPersistenceShutdown(flush, phase);
  expect(phase.addBlocker).toHaveBeenCalledWith(expect.stringContaining("MetaFlow"), flush);
  expect(flush).not.toHaveBeenCalled();
  unregister();
  expect(phase.removeBlocker).toHaveBeenCalledWith(flush);
});

it("uses the real Gecko profile-before-change phase by default", () => {
  const phase = { addBlocker: vi.fn(), removeBlocker: vi.fn() };
  const load = vi.fn(() => ({ AsyncShutdown: { profileBeforeChange: phase } }));
  vi.stubGlobal("ChromeUtils", { importESModule: load });
  const flush = async () => {};
  registerPersistenceShutdown(flush);
  expect(load).toHaveBeenCalledWith("resource://gre/modules/AsyncShutdown.sys.mjs");
  expect(phase.addBlocker).toHaveBeenCalledOnce();
});
