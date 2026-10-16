import { afterEach, expect, it, vi } from "vitest";
import { config } from "../../package.json";
import { migrateGreenFrogPreferences } from "./greenfrog-migration";

afterEach(() => vi.unstubAllGlobals());
it("imports legacy overrides once without changing explicit MetaFlow preferences", () => {
  const prefix = `${config.prefsPrefix}.`;
  const values = new Map<string, unknown>([
    ["extensions.zotero.greenfrog.secretkey", "legacy-test-key"],
    ["extensions.zotero.greenfrog.jcr.qu", true],
    [`${prefix}easyscholar.fields.jcr`, false],
  ]);
  vi.stubGlobal("Services", { prefs: { prefHasUserValue: (key: string) => values.has(key) } });
  vi.stubGlobal("Zotero", { Prefs: { get: (key: string) => values.get(key), set: (key: string, value: unknown) => values.set(key, value) } });
  expect(migrateGreenFrogPreferences()).toBe(2);
  expect(values.get(`${prefix}easyscholar.secretKey`)).toBe("legacy-test-key");
  expect(values.get(`${prefix}easyscholar.fields.jcr`)).toBe(false);
  expect(values.get(`${prefix}easyscholar.columns.jcr`)).toBe(true);
  expect(values.get(`${prefix}integration.greenfrogMigrationSummary`)).not.toContain("legacy-test-key");
  expect(migrateGreenFrogPreferences()).toBe(0);
});

function migrate(values: Map<string, unknown>) {
  vi.stubGlobal("Services", { prefs: { prefHasUserValue: (key: string) => values.has(key) } });
  vi.stubGlobal("Zotero", { Prefs: { get: (key: string) => values.get(key), set: (key: string, value: unknown) => values.set(key, value) } });
  return migrateGreenFrogPreferences();
}

it("skips wrong preference types and stores a summary without secret values", () => {
  const values = new Map<string, unknown>([
    ["extensions.zotero.greenfrog.secretkey", true],
    ["extensions.zotero.greenfrog.jcr.qu", "true"],
    ["extensions.zotero.greenfrog.swufe", false],
  ]);
  expect(migrate(values)).toBe(2);
  const summary = JSON.parse(values.get(`${config.prefsPrefix}.integration.greenfrogMigrationSummary`) as string);
  expect(summary.skipped).toHaveLength(3);
  expect(values.has(`${config.prefsPrefix}.easyscholar.secretKey`)).toBe(false);
});

it("rejects imported collisions with default and existing custom shortcuts", () => {
  const values = new Map<string, unknown>([
    ["extensions.zotero.greenfrog.shortcut.input.update.journal.info", "T"],
    ["extensions.zotero.greenfrog.shortcut.input.data.dir", "X"],
    [`${config.prefsPrefix}.shortcut.lint`, "alt,X"],
  ]);
  expect(migrate(values)).toBe(0);
  expect(values.has(`${config.prefsPrefix}.shortcut.easyScholar`)).toBe(false);
  expect(values.has(`${config.prefsPrefix}.shortcut.dataDirectory`)).toBe(false);
  const summary = JSON.parse(values.get(`${config.prefsPrefix}.integration.greenfrogMigrationSummary`) as string);
  expect(summary.skipped.map((entry: any) => entry.reason)).toEqual(["shortcut-conflict", "shortcut-conflict"]);
});

it("accepts a coordinated shortcut swap and disabled shortcuts", () => {
  const values = new Map<string, unknown>([
    ["extensions.zotero.greenfrog.shortcut.input.update.journal.info", "T"],
    ["extensions.zotero.greenfrog.shortcut.input.title.sentence.case", "J"],
    ["extensions.zotero.greenfrog.shortcut.data.dir", false],
  ]);
  expect(migrate(values)).toBe(3);
  expect(values.get(`${config.prefsPrefix}.shortcut.easyScholar`)).toBe("accel,T");
  expect(values.get(`${config.prefsPrefix}.shortcut.titleSentence`)).toBe("accel,J");
  expect(values.get(`${config.prefsPrefix}.shortcut.dataDirectory`)).toBe("");
});
