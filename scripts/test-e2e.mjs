import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function run(args, env = process.env, requireTests = false) {
  const result = spawnSync("pnpm", args, { cwd: projectRoot, stdio: requireTests ? ["inherit", "pipe", "pipe"] : "inherit", encoding: "utf8", maxBuffer: 16 * 1024 * 1024, shell: process.platform === "win32", env });
  if (requireTests) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
  }
  if (result.error)
    throw result.error;
  if (result.status !== 0)
    process.exit(result.status ?? 1);
  if (requireTests) {
    const plain = stripVTControlCharacters(`${result.stdout}\n${result.stderr}`);
    const count = plain.match(/Test run completed\s*-\s*(\d+) passed/);
    if (!count || Number(count[1]) === 0)
      throw new Error("The E2E runner did not report any passing tests; refusing an empty or incomplete run.");
  }
}

const testDirectory = path.resolve(projectRoot, process.env.METAREF_TEST_ENTRIES || "test/tests");
if (!statSync(testDirectory).isDirectory())
  throw new Error("METAREF_TEST_ENTRIES must be a test directory, not a single file.");
function containsTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).some(entry => entry.isDirectory()
    ? containsTests(path.join(directory, entry.name))
    : /\.(?:spec|test)\.[jt]s$/.test(entry.name));
}
if (!containsTests(testDirectory))
  throw new Error("The selected E2E directory contains no test files.");

run(["build"]);
const qa = path.join(projectRoot, ".scaffold", "qa");
mkdirSync(qa, { recursive: true });
const packagePath = path.join(qa, "zotero-metaflow-production.xpi");
copyFileSync(path.join(projectRoot, ".scaffold", "build", "zotero-metaflow.xpi"), packagePath);
const version = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8")).version;
const updateFile = version.includes("-") ? "update-beta.json" : "update.json";
copyFileSync(path.join(projectRoot, ".scaffold", "build", updateFile), path.join(qa, "zotero-metaflow-production-update.json"));
run(["exec", "zotero-plugin", "test", "--no-watch"], {
  ...process.env,
  METAREF_TEST_PACKAGE_PATH: packagePath,
  ZOTERO_PLUGIN_KILL_COMMAND: process.env.ZOTERO_PLUGIN_KILL_COMMAND || (process.platform === "win32" ? "pwsh -NoProfile -Command \"exit 0\"" : "true"),
}, true);
