import { describe, expect, it, vi } from "vitest";
import { watchPreferencePane } from "./preference-window";

function fixture(present = false) {
  const listeners = new Set<(event: Event) => void>();
  const document = {
    getElementById: vi.fn(() => present ? {} : null),
    addEventListener: vi.fn((_type, listener, capture) => {
      expect(capture).toBe(true);
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type, listener, capture) => {
      expect(capture).toBe(true);
      listeners.delete(listener);
    }),
  };
  const load = (id: string) => {
    for (const listener of listeners)
      listener({ target: { id }, bubbles: false } as unknown as Event);
  };
  return { win: { document } as unknown as Window, load, listeners };
}

describe("preferences fragment loading", () => {
  it("handles scripts loaded before a non-bubbling fragment load, filters other panes, and releases the listener", () => {
    const { win, load, listeners } = fixture();
    const initialize = vi.fn();
    const cleanup = watchPreferencePane(win, "metaref", initialize);
    expect(initialize).not.toHaveBeenCalled();
    load("another-plugin");
    expect(initialize).not.toHaveBeenCalled();
    load("metaref");
    expect(initialize).toHaveBeenCalledWith(win);
    cleanup();
    expect(listeners.size).toBe(0);
    load("metaref");
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it("initializes an already inserted pane", () => {
    const { win } = fixture(true);
    const initialize = vi.fn();
    watchPreferencePane(win, "metaref", initialize)();
    expect(initialize).toHaveBeenCalledOnce();
  });

  it("releases the document listener if immediate initialization fails", () => {
    const { win, listeners } = fixture(true);
    expect(() => watchPreferencePane(win, "metaref", () => {
      throw new Error("init");
    })).toThrow("init");
    expect(listeners.size).toBe(0);
  });
});
