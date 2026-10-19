import type { Runner } from "mocha";

const testWindow = globalThis as unknown as {
  mocha: { reporter: (reporter: new (runner: Runner) => object) => void };
  Reporter: new (runner: Runner) => object;
  debug: (message: string) => void;
};

testWindow.mocha.reporter(class extends testWindow.Reporter {
  constructor(runner: Runner) {
    super(runner);
    runner.on("fail", (test, error) => {
      testWindow.debug(`E2E failure: ${test.fullTitle()}\n${error.stack || String(error)}`);
    });
  }
});
