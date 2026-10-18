import { afterEach, describe, expect, it, vi } from "vitest";
import { createLogger } from "./logger";

afterEach(() => vi.unstubAllGlobals());

describe("window-independent diagnostics", () => {
  it("retains an error without throwing when the main window is unavailable", () => {
    const debug = vi.fn();
    vi.stubGlobal("Zotero", { debug });
    vi.stubGlobal("ztoolkit", { getGlobal: () => {
      throw new Error("Window closed");
    } });
    expect(() => createLogger("closing").error("A committed result remains available")).not.toThrow();
    expect(debug).toHaveBeenCalledWith(expect.stringContaining("committed result"));
  });
  it("writes debug diagnostics without requiring toolkit UI globals", () => {
    const debug = vi.fn();
    vi.stubGlobal("Zotero", { debug });
    vi.stubGlobal("ztoolkit", {});
    expect(() => createLogger("closing").debug("queued task settled")).not.toThrow();
    expect(debug).toHaveBeenCalledWith(expect.stringContaining("queued task settled"));
  });
});
