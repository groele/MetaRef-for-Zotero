import type { BatchResult } from "./modules/runner";
import type { AutomaticWorkflow } from "./utils/automatic-workflow";
import type { CoreCommand, CoreStage } from "./utils/core-workflow";
import { config } from "../package.json";
import api from "./api";
import hooks from "./hooks";
import { LintRunner } from "./modules/runner";
import { createZToolkit } from "./utils/ztoolkit";

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs?: {
      window: Window;
    };
    dialogs: Map<string, Window>;
    lastAutomaticWorkflow?: AutomaticWorkflow;
    lastCoreWorkflow?: { lastResult: BatchResult; stages: { stage: CoreStage; result: BatchResult }[] };
    activeCoreWorkflow?: { command: CoreCommand; stage?: CoreStage; index: number; total: number; cancelled: boolean; cancel: () => void };
  };

  public runner: LintRunner;

  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: typeof api;

  constructor() {
    this.data = {
      alive: true,
      config,
      env: __env__,
      ztoolkit: createZToolkit(),
      dialogs: new Map(),
    };
    this.hooks = hooks;
    this.api = api;
    this.runner = new LintRunner();
  }
}

export default Addon;
