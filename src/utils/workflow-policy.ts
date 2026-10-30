/** Local checking must not silently perform remote enrichment. */
export const REMOTE_STANDARD_RULES = new Set(["require-doi", "correct-doi-long"]);

export const CORE_COMMANDS = new Set(["standard", "tool-update-metadata", "tool-review-preprint"]);

export function commandVisible(key: string, compact: boolean, enabled: boolean): boolean {
  return enabled && (!compact || CORE_COMMANDS.has(key));
}

export function commandPrimary(key: string, compact: boolean, configured: boolean): boolean {
  return compact ? CORE_COMMANDS.has(key) : configured;
}

export function ruleSupportsItems(rule: { scope: string; targetItemTypes?: readonly string[]; ignoreItemTypes?: readonly string[] }, items: { itemType: string }[]): boolean {
  return (rule.scope === "item" || rule.scope === "field")
    && items.some(item => (!rule.targetItemTypes || rule.targetItemTypes.includes(item.itemType)) && !rule.ignoreItemTypes?.includes(item.itemType));
}
