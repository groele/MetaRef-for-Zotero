import { describe, expect, it } from "vitest";
import { shareJournalCard, showBottomLeftNotice } from "./journal-card-share";

describe("journal-card-share", () => {
  it("safely handles null or headless document without throwing", () => {
    expect(() => {
      showBottomLeftNotice(undefined as any);
      shareJournalCard({
        doc: undefined as any,
        publication: "Acta Materialia",
        displayedRankings: [
          { key: "jcr", labelID: "field-jcr", value: "Q1" },
          { key: "cas", labelID: "field-cas", value: "材料科学 TOP" },
          { key: "impactFactor", labelID: "field-impactFactor", value: "9.3" },
        ],
        sciRanking: { key: "sci", labelID: "field-sci", value: "是" },
        rows: [
          { label: "ESI 学科", value: "材料科学", matched: true },
          { label: "Nature Index", value: "暂无匹配记录", matched: false },
        ],
        matchBases: ["匹配依据·ISSN · 13596454"],
        issn: "13596454",
      });
    }).not.toThrow();
  });

  it("supports silent text, silent image and modal sharing modes", () => {
    const makeElement = () => ({
      setAttribute: () => {},
      append: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      remove: () => {},
      style: {},
      replaceChildren: () => {},
    });

    const fakeDoc = {
      createElementNS: () => makeElement(),
      getElementById: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      documentElement: makeElement(),
      defaultView: {
        navigator: {
          clipboard: {
            writeText: async () => {},
          },
        },
      },
    } as unknown as Document;

    const data = {
      doc: fakeDoc,
      publication: "Nature",
      displayedRankings: [{ key: "jcr", labelID: "field-jcr", value: "Q1" }],
      rows: [],
      matchBases: [],
    };

    expect(() => {
      shareJournalCard(data, { mode: "silent", silentFormat: "text" });
      shareJournalCard(data, { mode: "silent", silentFormat: "image" });
      shareJournalCard(data, { mode: "modal" });
    }).not.toThrow();
  });
});
