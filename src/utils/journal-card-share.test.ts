import { afterEach, describe, expect, it, vi } from "vitest";
import { shareJournalCard } from "./journal-card-share";

vi.mock("./locale", () => ({ getString: (id: string) => id }));
afterEach(() => vi.unstubAllGlobals());
const data = (doc: any) => ({ doc, publication: "Nature", displayedRankings: [], rows: [], matchBases: [] });
const document = (writeText: any, canvas?: any) => ({ defaultView: { navigator: { clipboard: { writeText } } }, createElementNS: () => canvas || { getContext: () => null } });
describe("sharing completion", () => {
  it("reports text fallback only after clipboard completion", async () => {
    let finish!: () => void;
    const write = vi.fn(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));
    const pending = shareJournalCard(data(document(write)), { mode: "silent", silentFormat: "image" });
    for (let i = 0; i < 6; i++)
      await Promise.resolve();
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    expect(settled).toBe(false);
    finish();
    expect(await pending).toBe("text");
  });
  it("reports clipboard rejection as failure", async () => {
    expect(await shareJournalCard(data(document(vi.fn().mockRejectedValue(new Error("denied")))), { mode: "silent", silentFormat: "text" })).toBe("failed");
  });
  it("handles unavailable document", async () => {
    expect(await shareJournalCard(data(null))).toBe("failed");
  });
});
