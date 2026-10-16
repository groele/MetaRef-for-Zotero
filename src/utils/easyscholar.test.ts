import { afterEach, describe, expect, it, vi } from "vitest";
import { mergeEasyScholarExtra } from "../modules/rules/tool-update-easyscholar";
import { clearEasyScholarCache, fetchEasyScholarRank, parseEasyScholarRank } from "./easyscholar";

describe("easyScholar data integration", () => {
  afterEach(() => {
    clearEasyScholarCache();
    vi.unstubAllGlobals();
  });

  it("normalizes service field names and keeps string values", () => {
    expect(parseEasyScholarRank({
      "sci": "Q1",
      "sciif": 8.4,
      "sciUp": "1 区",
      "中科院升级版 Top 分区": "Top",
      "5 年影响因子": 7.2,
      "cssci": "否",
    })).toMatchObject({
      jcr: "Q1",
      sci: "是",
      impactFactor: "8.4",
      casUpgrade: "1 区",
      casTop: "Top",
      impactFactor5Year: "7.2",
      cssci: "否",
    });
  });

  it("updates only returned EasyScholar fields and preserves unrelated Extra text", () => {
    const merged = mergeEasyScholarExtra("manual note\n影响因子：old\nCustom: keep", {
      impactFactor: "8.4",
      jcr: "Q1",
      ei: "否",
    });
    const colon = String.fromCharCode(58);
    const impactLine = merged.split("\n").find(line => line.startsWith("影响因子"));
    const jcrLine = merged.split("\n").find(line => line.startsWith("JCR"));
    expect(merged).toContain("manual note");
    expect(merged).toContain("Custom: keep");
    expect(impactLine?.slice(4)).toBe(`${colon} 8.4`);
    expect(jcrLine).toBe(["JCR 分区", colon, " Q1"].join(""));
    expect(merged).not.toContain("影响因子：old");
    expect(merged).not.toContain(`EI${String.fromCharCode(58)}`);
  });

  it("does not alter existing Extra when the response contains no usable values", () => {
    expect(mergeEasyScholarExtra("manual note", {})).toBe("manual note");
  });

  it("uses the configured key over HTTPS and caches a successful journal lookup", async () => {
    const get = vi.fn().mockReturnValue("test-key");
    const request = vi.fn().mockResolvedValue({
      status: 200,
      responseText: JSON.stringify({ code: 200, data: { officialRank: { all: { sciif: "9.1" } } } }),
    });
    vi.stubGlobal("Zotero", { Prefs: { get }, HTTP: { request } });

    const first = await fetchEasyScholarRank("Journal of Tests");
    const second = await fetchEasyScholarRank("Journal of Tests");

    expect(first).toEqual({ status: "success", data: expect.objectContaining({ impactFactor: "9.1" }) });
    expect(second).toEqual(first);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1]).toMatch(/^https:\/\/www\.easyscholar\.cc\/open\/getPublicationRank\?/);
    expect(request.mock.calls[0][1]).toContain("secretKey=test-key");
  });
});
