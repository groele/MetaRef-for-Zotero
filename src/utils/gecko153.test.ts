import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("gecko 153 frozen bootstrap globals", () => {
  it("loads bootstrap and the external preferences script with frozen builtins", async () => {
    const startup = vi.fn();
    const onPrefsEvent = vi.fn();
    const loadSubScript = vi.fn();
    const context = createContext({
      Zotero: { __addonInstance__: { hooks: { onStartup: startup, onPrefsEvent } } },
      Services: { prefs: { getDefaultBranch: () => ({}) }, scriptloader: { loadSubScript } },
    });
    runInContext("Object.freeze(Promise); Object.freeze(Array.prototype); Object.freeze(JSON);", context);
    runInContext(readFileSync("addon/bootstrap.js", "utf8"), context);
    await runInContext("startup({ rootURI: 'file:///test/' });", context);
    expect(startup).toHaveBeenCalledOnce();
    expect(loadSubScript).toHaveBeenCalledTimes(2);
    runInContext("var window = {};", context);
    runInContext(readFileSync("addon/content/scripts/preferences.js", "utf8"), context);
    expect(onPrefsEvent).toHaveBeenCalledWith("load-script", { window: context.window });
  });
});
