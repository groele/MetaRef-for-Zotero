import { describe, expect, it } from "vitest";
import { NavigationQueryCache } from "./navigation-query-cache";

describe("navigation query suppression", () => {
  it("retries missing results after five minutes and errors after thirty seconds", () => {
    const cache = new NavigationQueryCache();
    cache.remember(1, "journal-settings-extra", false, 0);
    cache.remember(2, "journal-settings-extra", true, 0);
    expect(cache.has(1, "journal-settings-extra", 299_999)).toBe(true);
    expect(cache.has(1, "journal-settings-extra", 300_000)).toBe(false);
    expect(cache.has(2, "journal-settings-extra", 29_999)).toBe(true);
    expect(cache.has(2, "journal-settings-extra", 30_000)).toBe(false);
    expect(cache.has(1, "changed journal or settings", 1)).toBe(false);
  });
  it("bounds storage and allows an explicit reload", () => {
    const cache = new NavigationQueryCache();
    for (let id = 0; id < 129; id++) cache.remember(id, "key", false, 0);
    expect(cache.has(0, "key", 1)).toBe(false);
    expect(cache.has(128, "key", 1)).toBe(true);
    cache.clear();
    expect(cache.has(128, "key", 1)).toBe(false);
  });
});
