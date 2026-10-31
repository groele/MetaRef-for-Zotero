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
  if (command === "check") {
    // 检查并修复元数据：严格 100% 纯本地离线执行！绝对禁止网络通信！
    stages.push("format");
    if (options.checkDuplicates)
      stages.push("duplicates");
    return stages;
  }
  // 更新元数据：集中收敛在线学术增强与自动补全
  if (options.updateMetadata)
    stages.push("metadata");
  if (options.updateFormat)
    stages.push("format");
  if (options.updateJournal)
    stages.push("journal");
  if (options.updateDuplicates)
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
