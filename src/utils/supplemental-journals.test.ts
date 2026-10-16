import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSupplementalJournalRank, getNjauCore, parseChineseImpactFactors } from "./supplemental-journals";

describe("supplemental journal sources", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("uses the attributed historical NJAU list and validates numeric impact factors", () => {
    expect(getNjauCore("病毒学报")).toBe("一类核心");
    expect(getNjauCore("\u6570\u5B66\u5E74\u520AA\u8F91")).toBe("二类核心");
    expect(getNjauCore("Unknown journal")).toBeUndefined();
    expect(parseChineseImpactFactors({ data: { fhyz: "1.25", zhyz: 0 } })).toEqual({ compoundIF: "1.25", comprehensiveIF: "0" });
    expect(parseChineseImpactFactors({ data: { fhyz: {}, zhyz: "not a number" } })).toEqual({ compoundIF: undefined, comprehensiveIF: undefined });
  });
  it("reports source failures without discarding independent local results", async () => {
    vi.stubGlobal("Zotero", { HTTP: { request: vi.fn().mockRejectedValue(new Error("offline")) } });
    const result = await fetchSupplementalJournalRank("病毒学报", new Set(["njauCore", "njauQuality"]));
    expect(result.data.njauCore).toBe("一类核心");
    expect(result.errors).toHaveLength(1);
  });
  it("does not contact remote sources when their options are disabled", async () => {
    const request = vi.fn();
    vi.stubGlobal("Zotero", { HTTP: { request } });
    const result = await fetchSupplementalJournalRank("No remote lookup", new Set());
    expect(result).toEqual({ data: {}, errors: [] });
    expect(request).not.toHaveBeenCalled();
  });
  it("retains one remote result when another independent source fails", async () => {
    const request = vi.fn(async (_method: string, url: string) => {
      if (url.includes("njau.edu.cn"))
        throw new Error("NJAU offline");
      return { responseText: JSON.stringify({ data: { fhyz: "2.5", zhyz: "1.2" } }) };
    });
    vi.stubGlobal("Zotero", { HTTP: { request } });
    const result = await fetchSupplementalJournalRank("独立来源测试", new Set(["compoundIF", "njauQuality"]));
    expect(result.data.compoundIF).toBe("2.5");
    expect(result.errors).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][0]).toBe("GET");
  });
  it("stops an aborted lookup before starting any request", async () => {
    const request = vi.fn();
    vi.stubGlobal("Zotero", { HTTP: { request } });
    const controller = new AbortController();
    controller.abort(new Error("cancelled"));
    await expect(fetchSupplementalJournalRank("Cancelled", new Set(["njauQuality"]), controller.signal)).rejects.toThrow("cancelled");
    expect(request).not.toHaveBeenCalled();
  });
  it("keeps successful remote data when a sibling source never resolves", async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal("Zotero", { HTTP: { request: vi.fn(async (_method: string, url: string) => url.includes("njau.edu.cn")
        ? new Promise(() => {})
        : { responseText: JSON.stringify({ data: { fhyz: "3.7" } }) }) } });
      const pending = fetchSupplementalJournalRank("来源独立超时测试", new Set(["compoundIF", "njauQuality"]));
      await vi.advanceTimersByTimeAsync(9000);
      const result = await pending;
      expect(result.data.compoundIF).toBe("3.7");
      expect(result.errors).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
});
