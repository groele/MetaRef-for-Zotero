import { describe, expect, it } from "vitest";
import { commandPrimary, commandVisible, REMOTE_STANDARD_RULES, ruleSupportsItems } from "./workflow-policy";

describe("compact workflows", () => {
  it("shows core commands by default and restores explicit advanced placements", () => {
    expect(["standard", "tool-update-metadata", "tool-clear-all-extra"].filter(key => commandVisible(key, true, true))).toEqual(["standard", "tool-update-metadata"]);
    expect(commandPrimary("standard", true, false)).toBe(true);
    expect(commandPrimary("tool-update-metadata", true, false)).toBe(true);
    expect(commandPrimary("tool-clear-all-extra", false, false)).toBe(false);
    expect(commandVisible("tool-clear-all-extra", false, true)).toBe(true);
    expect(commandVisible("standard", true, false)).toBe(false);
  });
  it("keeps identifier network work out of local standard checking", () => {
    expect(REMOTE_STANDARD_RULES.has("require-doi")).toBe(true);
    expect(REMOTE_STANDARD_RULES.has("correct-doi-long")).toBe(true);
    expect(REMOTE_STANDARD_RULES.has("no-doi-prefix")).toBe(false);
    expect(REMOTE_STANDARD_RULES.has("require-journal-abbr")).toBe(false);
  });
  it("skips preparing rules with no eligible item types", () => {
    expect(ruleSupportsItems({ scope: "item", targetItemTypes: ["thesis"] }, [{ itemType: "journalArticle" }])).toBe(false);
    expect(ruleSupportsItems({ scope: "field", ignoreItemTypes: ["book"] }, [{ itemType: "book" }])).toBe(false);
    expect(ruleSupportsItems({ scope: "field", targetItemTypes: ["book"] }, [{ itemType: "journalArticle" }, { itemType: "book" }])).toBe(true);
    expect(ruleSupportsItems({ scope: "attachment" }, [{ itemType: "journalArticle" }])).toBe(false);
  });
});
