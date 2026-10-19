/** Yield cached/local work to Gecko so paint, input and cancellation can run. */
export function createWorkCheckpoint(budgetMs = 8, maxSteps = 64) {
  let started = Date.now();
  let steps = 0;
  return async () => {
    if (++steps < maxSteps && Date.now() - started < budgetMs)
      return;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    started = Date.now();
    steps = 0;
  };
}
