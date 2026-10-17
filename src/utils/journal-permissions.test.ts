import { beforeEach, expect, it, vi } from "vitest";
import { EASYSCHOLAR_FIELD_DEFINITIONS } from "./easyscholar";
import { canRunJournalRule, hasEnabledJournalMetrics, isJournalIndexEnabled } from "./journal-permissions";

const values = vi.hoisted(() => new Map<string, unknown>());
vi.mock("./prefs", () => ({ getPref: (key: string, fallback: unknown) => values.get(key) ?? fallback }));
beforeEach(() => values.clear());

it("blocks all journal actions when the master selections are empty", () => {
  for (const field of EASYSCHOLAR_FIELD_DEFINITIONS)
    values.set(`easyscholar.fields.${field.key}`, false);
  values.set("insights.natureEnabled", false);
  expect(hasEnabledJournalMetrics()).toBe(false);
  for (const id of ["tool-update-easyscholar", "tool-query-esi", "tool-query-nature-index"])
    expect(canRunJournalRule(id)).toBe(false);
  expect(canRunJournalRule("correct-title-sentence-case")).toBe(true);
});

it("requires the ESI field master switch and the separate Nature Index master switch", () => {
  values.set("easyscholar.fields.esi", false);
  expect(isJournalIndexEnabled("esi")).toBe(false);
  expect(isJournalIndexEnabled("nature")).toBe(true);
  values.set("insights.natureEnabled", false);
  expect(isJournalIndexEnabled("nature")).toBe(false);
});
