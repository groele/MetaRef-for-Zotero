import { afterEach, describe, expect, it, vi } from "vitest";
import { preferenceListeners, releasePreferenceListeners } from "./preference-listeners";

afterEach(() => releasePreferenceListeners());

describe("preferences event lifetime", () => {
  it("removes all control listeners on release and keeps other windows active", () => {
    const doc = { defaultView: { AbortController } } as unknown as Document;
    const otherDoc = { defaultView: { AbortController } } as unknown as Document;
    const pane = { ownerDocument: doc } as Element;
    const otherPane = { ownerDocument: otherDoc } as Element;
    const first = new EventTarget() as unknown as Element;
    const second = new EventTarget() as unknown as Element;
    const handler = vi.fn();
    const otherHandler = vi.fn();
    preferenceListeners(pane)(first, "command", handler);
    preferenceListeners(otherPane)(second, "command", otherHandler);
    first.dispatchEvent(new Event("command"));
    releasePreferenceListeners(doc);
    first.dispatchEvent(new Event("command"));
    second.dispatchEvent(new Event("command"));
    expect(handler).toHaveBeenCalledOnce();
    expect(otherHandler).toHaveBeenCalledOnce();
    releasePreferenceListeners();
    second.dispatchEvent(new Event("command"));
    expect(otherHandler).toHaveBeenCalledOnce();
  });
});
