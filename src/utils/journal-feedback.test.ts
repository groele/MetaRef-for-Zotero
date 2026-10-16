import { expect, it } from "vitest";
import { isJournalFeedback } from "./journal-feedback";

it("keeps journal feedback and save warnings without mixing ordinary author changes into the index", () => {
  expect(isJournalFeedback({ ruleID: "tool-update-metadata", field: "creators", level: "info" })).toBe(false);
  expect(isJournalFeedback({ ruleID: "tool-update-metadata", field: "publicationTitle", level: "info" })).toBe(true);
  expect(isJournalFeedback({ ruleID: "tool-update-easyscholar", level: "info" })).toBe(true);
  expect(isJournalFeedback({ ruleID: "item-save", level: "error" })).toBe(true);
  expect(isJournalFeedback({ ruleID: "tool-update-metadata", field: "creators", level: "warning" })).toBe(true);
  expect(isJournalFeedback({ ruleID: "tool-update-easyscholar", code: "journal-summary", level: "info" })).toBe(false);
});
