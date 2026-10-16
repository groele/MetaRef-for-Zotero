import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnabledEasyScholarFields, mergeEasyScholarExtra } from "../modules/rules/tool-update-easyscholar";
import { clearEasyScholarCache, EASYSCHOLAR_DEFAULT_FIELDS, EASYSCHOLAR_FIELD_DEFINITIONS, fetchEasyScholarRank, getEasyScholarFieldMessageID, parseEasyScholarRank, testEasyScholarConnection } from "./easyscholar";

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
      "xr": "新锐 2 区",
      "xrTop": "新锐 Top",
      "中科院升级版 Top 分区": "Top",
      "5 年影响因子": 7.2,
      "cssci": "否",
    })).toMatchObject({
      jcr: "Q1",
      sci: "是",
      impactFactor: "8.4",
      casUpgrade: "1 区",
      newSharp: "新锐 2 区",
      newSharpTop: "新锐 Top",
      casTop: "Top",
      impactFactor5Year: "7.2",
      cssci: "否",
    });
  });

  it("keeps defaults and field labels aligned with preference localization IDs", () => {
    expect(EASYSCHOLAR_DEFAULT_FIELDS.size).toBe(23);
    expect(EASYSCHOLAR_FIELD_DEFINITIONS.map(field => getEasyScholarFieldMessageID(field.key)))
      .toContain("easyscholar-field-if");
    expect(getEasyScholarFieldMessageID("casUpgrade")).toBe("easyscholar-field-cas-upgrade");
    expect(getEasyScholarFieldMessageID("newSharpTop")).toBe("easyscholar-field-new-sharp-top");
    expect(EASYSCHOLAR_FIELD_DEFINITIONS.filter(field => "group" in field && field.group === "university")).toHaveLength(19);
  });

  it("parses configured university rankings and selected EasyScholar custom datasets", () => {
    const rank = parseEasyScholarRank(
      { swufe: "A1" },
      {
        rankInfo: [{ uuid: "1642199434173014016", oneRankText: "A", twoRankText: "B" }],
        rank: ["16421994341730140160001"],
      },
    );
    expect(rank).toMatchObject({ swufe: "A1", clsci: "是" });
    expect(mergeEasyScholarExtra("Manual", rank, new Set(["swufe", "clsci"])))
      .toBe(["Manual", ["西南财经大学", String.fromCharCode(58), " A1"].join(""), "CLSCI: 是"].join("\n"));
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

  it("replaces legacy keys only when a selected field has a usable update", () => {
    const legacyJCR = "JCR\u5206\u533A";
    const legacyIF5 = "5\u5E74\u5F71\u54CD\u56E0\u5B50";
    const original = `${legacyJCR}: Q3\n${legacyIF5}: 3.1\nManual note`;
    const merged = mergeEasyScholarExtra(original, { jcr: "Q1" }, new Set(["jcr"]));
    expect(merged).not.toContain(`${legacyJCR}:`);
    expect(merged).toContain(["JCR 分区", String.fromCharCode(58), " Q1"].join(""));
    expect(merged).toContain(`${legacyIF5}: 3.1`);
    expect(mergeEasyScholarExtra(original, { jcr: "" }, new Set(["jcr"]))).toBe(original);
    expect(mergeEasyScholarExtra(`${legacyJCR}：https://old.example/`, { jcr: "Q1" }, new Set(["jcr"])))
      .toBe(["JCR 分区", String.fromCharCode(58), " Q1"].join(""));
  });

  it("preserves official values when custom arrays are malformed and keeps SSCI quartiles", () => {
    expect(parseEasyScholarRank({ sciif: "9.1", ssci: "Q2" }, { rankInfo: {}, rank: "invalid" }))
      .toMatchObject({ impactFactor: "9.1", ssci: "Q2" });
  });

  it("replaces each exact unspaced Green Frog key with its canonical key", () => {
    for (const [field, legacy, canonical] of [
      ["jcr", "JCR\u5206\u533A", "JCR 分区"],
      ["impactFactor5Year", "5\u5E74\u5F71\u54CD\u56E0\u5B50", "5 年影响因子"],
      ["casTop", "\u4E2D\u79D1\u9662\u5347\u7EA7\u7248Top\u5206\u533A", "中科院升级版 Top 分区"],
      ["newSharpTop", "\u65B0\u9510Top\u5206\u533A", "新锐 Top 分区"],
      ["swupl", "SWUPL", "西南政法大学"],
      ["coreRankings", "CORE\u8BC4\u7EA7", "CORE Rankings"],
    ] as const) {
      const merged = mergeEasyScholarExtra(`${legacy}: old`, { [field]: "new" }, new Set([field]));
      expect(merged).toBe([canonical, String.fromCharCode(58), " new"].join(""));
    }
  });

  it("fills missing CCF from the custom dataset without overwriting an official or curated value", () => {
    expect(mergeEasyScholarExtra("", { ccfCustom: "A" }, new Set(["ccfCustom"]))).toContain("CCF: A");
    const merged = mergeEasyScholarExtra("CCF: B", { ccfCustom: "A" }, new Set(["ccfCustom"]));
    expect(merged).toContain("CCF: B");
    expect(merged).not.toContain("CCF: A");
  });

  it("removes a previous affirmative index marker when the service returns a negative result", () => {
    expect(mergeEasyScholarExtra("EI: 是\nManual note", { ei: "否" })).toBe("Manual note");
  });

  it("leaves unselected EasyScholar fields untouched", () => {
    const colon = String.fromCharCode(58);
    expect(mergeEasyScholarExtra("JCR 分区：Q2\nManual note", { jcr: "Q1", impactFactor: "8.4" }, new Set(["impactFactor"])))
      .toBe(["JCR 分区：Q2", "Manual note", ["影响因子", colon, " 8.4"].join("")].join("\n"));
  });

  it("uses the configured output field switches", () => {
    vi.stubGlobal("Zotero", { Prefs: { get: (key: string) => key.endsWith("easyscholar.fields.jcr") ? false : undefined } });
    const enabled = getEnabledEasyScholarFields();
    expect(enabled.has("jcr")).toBe(false);
    expect(enabled.has("impactFactor")).toBe(true);
    expect(enabled.has("newSharp")).toBe(false);
    expect(enabled.has("swufe")).toBe(false);
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

  it("tests the API key without caching or changing a Zotero item", async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      responseText: JSON.stringify({ code: 200, data: { officialRank: { all: {} } } }),
    });
    vi.stubGlobal("Zotero", { HTTP: { request } });

    expect(await testEasyScholarConnection("  ")).toEqual({ status: "unconfigured" });
    expect(await testEasyScholarConnection("test-key")).toEqual({ status: "success" });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][1]).toContain("publicationName=Nature");
  });

  it("does not expose the API key in connection-test errors", async () => {
    vi.stubGlobal("Zotero", { HTTP: { request: vi.fn().mockRejectedValue(new Error("request failed: secretKey=test-key")) } });

    expect(await testEasyScholarConnection("test-key")).toEqual({ status: "error", message: "Network request failed" });
  });

  it("redacts the API key from service error messages", async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      responseText: JSON.stringify({ code: 403, msg: "Invalid key test-key" }),
    });
    vi.stubGlobal("Zotero", { HTTP: { request } });

    expect(await testEasyScholarConnection("test-key")).toEqual({ status: "error", message: "Invalid key [redacted]" });
  });
});

it("treats an empty official and custom response as no matching data", async () => {
  clearEasyScholarCache();
  vi.stubGlobal("Zotero", {
    Prefs: { get: () => "empty-fixture-key" },
    HTTP: { request: vi.fn().mockResolvedValue({ responseText: JSON.stringify({ code: 200, data: { officialRank: { all: {} }, customRank: { rank: [], rankInfo: [] } } }) }) },
  });
  try {
    expect(await fetchEasyScholarRank("Empty response QA")).toEqual({ status: "not-found" });
  }
  finally {
    clearEasyScholarCache();
    vi.unstubAllGlobals();
  }
});

it("reads Nature Index membership only from the selected or named custom dataset", () => {
  const raw = { rankInfo: [{ uuid: "nature-fixture", name: "145 种自然指数统计期刊", oneRankText: "是", twoRankText: "否" }], rank: ["nature-fixture0001"] };
  expect(parseEasyScholarRank({}, raw)).toMatchObject({ natureIndex: "是", natureIndexDataset: "145 种自然指数统计期刊" });
  expect(parseEasyScholarRank({}, { ...raw, rank: ["nature-fixture0002"] }, "nature-fixture")).toMatchObject({ natureIndex: "否" });
  expect(parseEasyScholarRank({}, { ...raw, rank: [] }).natureIndex).toBeUndefined();
  expect(parseEasyScholarRank({}, raw, "another-library").natureIndex).toBeUndefined();
  expect(parseEasyScholarRank({}, { ...raw, rankInfo: [{ ...raw.rankInfo[0], name: "Unrelated directory" }] }).natureIndex).toBeUndefined();
});
