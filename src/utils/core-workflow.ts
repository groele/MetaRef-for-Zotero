export type CoreCommand = "check" | "update";
export type CoreStage = "metadata" | "authors" | "format" | "journal" | "duplicates";
export interface CoreOptions {
  checkMetadata: boolean;
  checkAuthors: boolean;
  checkJournal: boolean;
  checkDuplicates: boolean;
  updateMetadata: boolean;
  updateFormat: boolean;
  updateJournal: boolean;
  updateDuplicates: boolean;
}

export function coreWorkflowPlan(command: CoreCommand, options: CoreOptions): CoreStage[] {
  const stages: CoreStage[] = [];
  const check = command === "check";
  if (check ? options.checkMetadata : options.updateMetadata)
    stages.push("metadata");
  else if (check && options.checkAuthors)
    stages.push("authors");
  if (check || options.updateFormat)
    stages.push("format");
  if (check ? options.checkJournal : options.updateJournal)
    stages.push("journal");
  if (check ? options.checkDuplicates : options.updateDuplicates)
    stages.push("duplicates");
  return stages;
}

export async function executeCorePlan<T extends { cancelled: boolean }>(stages: CoreStage[], run: (stage: CoreStage) => Promise<T | undefined>, alive: () => boolean) {
  let latest: T | undefined;
  for (const stage of stages) {
    if (!alive())
      break;
    const result = await run(stage);
    if (result)
      latest = result;
    if (result?.cancelled)
      break;
  }
  return latest;
}
