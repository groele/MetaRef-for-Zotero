import type { EasyScholarRank } from "../../utils/easyscholar";
import { fetchEasyScholarRank } from "../../utils/easyscholar";
import { getString } from "../../utils/locale";
import { defineRule } from "./rule-base";

const EXTRA_FIELDS: Array<[keyof EasyScholarRank, string]> = [
  ["jcr", "JCR 分区"],
  ["casUpgrade", "中科院分区升级版"],
  ["casBasic", "中科院分区基础版"],
  ["casSmall", "中科院升级版小类分区"],
  ["casTop", "中科院升级版 Top 分区"],
  ["casWarning", "中科院预警"],
  ["impactFactor", "影响因子"],
  ["impactFactor5Year", "5 年影响因子"],
  ["sci", "SCI"],
  ["ssci", "SSCI"],
  ["ei", "EI"],
  ["ahci", "AHCI"],
  ["jci", "JCI"],
  ["esi", "ESI"],
  ["ajg", "AJG"],
  ["ccf", "CCF"],
  ["fms", "FMS"],
  ["utd24", "UTD24"],
  ["ft50", "FT50"],
  ["cssci", "CSSCI/南大核心"],
  ["pku", "中文核心期刊/北大核心"],
  ["cscd", "CSCD"],
  ["technologyCore", "中国科技核心期刊"],
];

function formatFieldValue(key: keyof EasyScholarRank, value: string): string {
  if (["sci", "ssci", "ei", "utd24", "ft50", "cssci", "pku", "cscd", "technologyCore"].includes(key)) {
    if (/^(?:否|no|false|0)$/i.test(value.trim()))
      return "";
    if (/^(?:是|yes|true|1)$/i.test(value.trim()))
      return "是";
  }
  return value.trim();
}

function mergeExtra(existing: string, data: EasyScholarRank): string {
  const updates = new Map<string, string>();
  for (const [dataKey, extraKey] of EXTRA_FIELDS) {
    const value = data[dataKey];
    if (value) {
      const formatted = formatFieldValue(dataKey, value);
      if (formatted)
        updates.set(extraKey, formatted);
    }
  }
  const lines = existing.split(/\r?\n/);
  const kept = lines.filter((line) => {
    const separator = line.includes(":") ? line.indexOf(":") : line.indexOf("：");
    return separator < 0 || !updates.has(line.slice(0, separator).trim());
  });
  for (const [key, value] of updates)
    kept.push(`${key}: ${value}`);
  return kept.filter((line, index, all) => line || index < all.length - 1).join("\n").trim();
}

export const ToolUpdateEasyScholar = defineRule({
  id: "tool-update-easyscholar",
  scope: "item",
  category: "tool",
  cooldown: 500,
  timeout: 20_000,
  targetItemTypes: ["journalArticle", "conferencePaper"],
  getItemMenu: () => ({ l10nID: "rule-tool-update-easyscholar-menu-item" }),
  async apply({ item, debug, report, signal }) {
    const title = String(item.getField("publicationTitle") || item.getField("conferenceName") || "").trim();
    if (!title) {
      report({ level: "warning", message: getString("rule-tool-update-easyscholar-no-title") });
      return;
    }
    const result = await fetchEasyScholarRank(title, signal);
    if (result.status === "unconfigured") {
      report({ level: "warning", message: getString("rule-tool-update-easyscholar-unconfigured") });
      return;
    }
    if (result.status === "not-found") {
      report({ level: "info", message: getString("rule-tool-update-easyscholar-not-found", { args: { title } }) });
      return;
    }
    if (result.status === "error") {
      report({ level: "warning", message: getString("rule-tool-update-easyscholar-failed", { args: { error: result.message } }) });
      return;
    }
    const added = EXTRA_FIELDS.filter(([key]) => Boolean(formatFieldValue(key, result.data[key] || ""))).length;
    if (!added) {
      report({ level: "info", message: getString("rule-tool-update-easyscholar-no-fields", { args: { title } }) });
      return;
    }
    const current = String(item.getField("extra") || "");
    const updated = mergeExtra(current, result.data);
    if (updated !== current.trim())
      item.setField("extra", updated);
    debug(`${title}: retrieved ${added} EasyScholar fields; item save is handled by the batch runner.`);
    report({ level: "info", message: getString("rule-tool-update-easyscholar-updated", { args: { count: added, title } }) });
  },
});

export { mergeExtra as mergeEasyScholarExtra };
