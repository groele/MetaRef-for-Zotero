import { EASYSCHOLAR_FIELD_DEFINITIONS, isEasyScholarFieldEnabled } from "./easyscholar";
import { getPref } from "./prefs";

export function isJournalIndexEnabled(kind: "esi" | "nature"): boolean {
  return kind === "esi" ? isEasyScholarFieldEnabled("esi") : getPref("insights.natureEnabled" as any, true) === true;
}

export function hasEnabledJournalMetrics(): boolean {
  return EASYSCHOLAR_FIELD_DEFINITIONS.some(field => isEasyScholarFieldEnabled(field.key)) || isJournalIndexEnabled("nature");
}

export function canRunJournalRule(id: string): boolean {
  if (id === "tool-query-esi")
    return isJournalIndexEnabled("esi");
  if (id === "tool-query-nature-index")
    return isJournalIndexEnabled("nature");
  return id !== "tool-update-easyscholar" || hasEnabledJournalMetrics();
}
