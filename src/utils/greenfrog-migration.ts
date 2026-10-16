import { config } from "../../package.json";
import { EASYSCHOLAR_FIELD_DEFINITIONS } from "./easyscholar";
import { normalizeShortcut, SHORTCUT_DEFAULTS } from "./shortcuts";

const legacyFieldKeys: Record<string, string> = {
  jcr: "jcr.qu",
  casUpgrade: "updated",
  casBasic: "basic",
  casSmall: "sci.up.small",
  casTop: "sci.up.top",
  casWarning: "sciwarn",
  impactFactor: "sci.if",
  impactFactor5Year: "sci.if5",
  cssci: "nju.core",
  pku: "pku.core",
  cscd: "chjcscd",
  technologyCore: "sci.core",
  newSharp: "xr",
  newSharpTop: "xrTop",
  newSharpSmall: "xrSmall",
  newSharpWarning: "xrWarn",
  ccfCustom: "ccf_c",
  coreRankings: "CoreRankings",
  scopus: "Scopus",
  abdc: "ABDC",
  hx: "HX",
  esci: "ESCI",
  compoundIF: "com.if",
  comprehensiveIF: "agg.if",
  njauCore: "njau.core",
  njauQuality: "njau.high.quality",
};

/** Copy explicit legacy user preferences once; never replace an existing MetaFlow user value. */
export function migrateGreenFrogPreferences(): number {
  const targetPrefix = `${config.prefsPrefix}.`;
  const legacyPrefix = "extensions.zotero.greenfrog.";
  const marker = `${targetPrefix}integration.greenfrogMigrated`;
  if (Zotero.Prefs.get(marker, true))
    return 0;
  const pairs: [string, string][] = [
    ["secretkey", "easyscholar.secretKey"],
    ["add.update", "easyscholar.autoUpdateOnAdded"],
    ["add.upmeta", "metadata.autoUpdateOnAdded"],
    ["update.abbr", "rule.require-journal-abbr"],
    ["update.abbr.dot", "rule.require-journal-abbr.withDots"],
    ["en.abbr", "rule.require-journal-abbr.usefull"],
    ["ch.abbr", "rule.require-journal-abbr.usefullZh"],
    ["update.title.sentence.case", "rule.correct-title-sentence-case"],
    ["update.publication.title.case", "rule.correct-publication-title-case"],
    ["bold.star", "menu.tool-creators-style"],
    ["swap.author", "menu.tool-creators-swap"],
    ["item.title.find.replace", "menu.tool-title-replace"],
    ["chang.pub.title", "menu.tool-publication-replace"],
    ["show.data.dir", "menu.show-data-directory"],
    ["show.profile.dir", "menu.show-profile-directory"],
  ];
  for (const field of EASYSCHOLAR_FIELD_DEFINITIONS) {
    if (field.key !== "sci") {
      const legacy = legacyFieldKeys[field.key] || field.key;
      pairs.push([legacy, `easyscholar.fields.${field.key}`], [legacy, `easyscholar.columns.${field.key}`]);
    }
  }
  let copied = 0;
  let found = false;
  const skipped: { key: string; reason: string }[] = [];
  for (const [oldKey, newKey] of pairs) {
    if (!Services.prefs.prefHasUserValue(legacyPrefix + oldKey))
      continue;
    found = true;
    if (Services.prefs.prefHasUserValue(targetPrefix + newKey))
      continue;
    const value = Zotero.Prefs.get(legacyPrefix + oldKey, true);
    const valid = newKey === "easyscholar.secretKey" ? typeof value === "string" : typeof value === "boolean";
    if (valid) {
      Zotero.Prefs.set(targetPrefix + newKey, value as string | boolean, true);
      copied++;
    }
    else {
      skipped.push({ key: newKey, reason: "invalid-type" });
    }
  }
  const bindings = new Map(Object.entries(SHORTCUT_DEFAULTS).map(([action, fallback]) => {
    const value = Zotero.Prefs.get(`${targetPrefix}shortcut.${action}`, true);
    return [action, typeof value === "string" ? value : fallback];
  }));
  const candidates = new Map<string, string>();
  for (const [action, legacy, modifier, fallback] of [
    ["easyScholar", "update.journal.info", "accel", "J"],
    ["titleSentence", "title.sentence.case", "accel", "T"],
    ["publicationCase", "publication.title.case", "accel", "U"],
    ["dataDirectory", "data.dir", "alt", "D"],
    ["profileDirectory", "profile.dir", "alt", "P"],
  ]) {
    const enabledKey = `${legacyPrefix}shortcut.${legacy}`;
    const bindingKey = `${legacyPrefix}shortcut.input.${legacy}`;
    if (!Services.prefs.prefHasUserValue(enabledKey) && !Services.prefs.prefHasUserValue(bindingKey))
      continue;
    found = true;
    const target = `${targetPrefix}shortcut.${action}`;
    if (Services.prefs.prefHasUserValue(target))
      continue;
    const enabled = Zotero.Prefs.get(enabledKey, true);
    const binding = Zotero.Prefs.get(bindingKey, true);
    if ((enabled !== undefined && typeof enabled !== "boolean") || (binding !== undefined && typeof binding !== "string")) {
      skipped.push({ key: `shortcut.${action}`, reason: "invalid-type" });
      continue;
    }
    const key = typeof binding === "string" ? binding.trim() : fallback;
    const candidate = enabled !== false && key ? `${modifier},${key}` : "";
    if (normalizeShortcut(candidate, Zotero.isMac) === null) {
      skipped.push({ key: `shortcut.${action}`, reason: "invalid-shortcut" });
      continue;
    }
    candidates.set(action, candidate);
  }
  // Resolve the entire proposal together so valid shortcut swaps remain possible.
  for (let changed = true; changed;) {
    changed = false;
    const conflicts = new Set<string>();
    const owners = new Map<string, string>();
    for (const [action, original] of bindings) {
      const normalized = normalizeShortcut(candidates.get(action) ?? original, Zotero.isMac);
      if (!normalized)
        continue;
      const other = owners.get(normalized);
      if (other) {
        conflicts.add(action);
        conflicts.add(other);
      }
      else {
        owners.set(normalized, action);
      }
    }
    for (const action of conflicts) {
      if (candidates.delete(action)) {
        skipped.push({ key: `shortcut.${action}`, reason: "shortcut-conflict" });
        changed = true;
      }
    }
  }
  for (const [action, binding] of candidates) {
    Zotero.Prefs.set(`${targetPrefix}shortcut.${action}`, binding, true);
    copied++;
  }
  if (found) {
    Zotero.Prefs.set(`${targetPrefix}integration.greenfrogMigrationSummary`, JSON.stringify({ copied, skipped }), true);
    Zotero.Prefs.set(marker, true, true);
  }
  return copied;
}
