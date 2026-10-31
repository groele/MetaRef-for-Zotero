import { describe, expect, it, vi } from "vitest";
import { coreWorkflowPlan, executeCorePlan } from "./core-workflow";

const defaults = { checkMetadata: false, checkAuthors: false, checkJournal: false, checkDuplicates: false, updateMetadata: true, updateFormat: true, updateJournal: true, updateDuplicates: false };

describe("core workflow scheduling", () => {
  it("keeps checking strictly offline and gives updating its own local formatting step", () => {
    expect(coreWorkflowPlan("check", defaults)).toEqual(["format"]);
    expect(coreWorkflowPlan("update", defaults)).toEqual(["metadata", "format", "journal"]);
  });
  it("enforces strict offline execution for check and repair", () => {
    expect(coreWorkflowPlan("check", { ...defaults, checkMetadata: true, checkAuthors: true, checkJournal: true, checkDuplicates: true })).toEqual(["format", "duplicates"]);
    expect(coreWorkflowPlan("check", { ...defaults, checkAuthors: true })).toEqual(["format"]);
  });
  it("can run journal metrics alone and keeps expensive duplicate review opt-in", () => {
    expect(coreWorkflowPlan("update", { ...defaults, updateMetadata: false, updateFormat: false })).toEqual(["journal"]);
    expect(coreWorkflowPlan("update", { ...defaults, updateMetadata: false, updateFormat: false, updateJournal: false })).toEqual([]);
    expect(coreWorkflowPlan("update", { ...defaults, updateDuplicates: true })).toEqual(["metadata", "format", "journal", "duplicates"]);
  });
  it("stops every later stage when the review is cancelled", async () => {
    const run = vi.fn(async () => ({ cancelled: true }));
    await executeCorePlan(coreWorkflowPlan("update", defaults), run, () => true);
    expect(run.mock.calls).toEqual([["metadata"]]);
  });
  it("continues independent metrics when metadata is unchanged and stops at shutdown", async () => {
    const run = vi.fn(async () => ({ cancelled: false, changed: 0 }));
    await executeCorePlan(coreWorkflowPlan("update", defaults), run, () => true);
    expect(run.mock.calls).toEqual([["metadata"], ["format"], ["journal"]]);
    run.mockClear();
    await executeCorePlan(coreWorkflowPlan("update", defaults), run, () => false);
    expect(run).not.toHaveBeenCalled();
  });
});
