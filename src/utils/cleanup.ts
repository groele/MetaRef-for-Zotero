/** Release independent resources even when one host unregister operation fails. */
export async function cleanupResources(actions: (() => unknown)[], reportError: (error: unknown) => void) {
  for (const action of actions) {
    try {
      await action();
    }
    catch (error) {
      reportError(error);
    }
  }
}

export function cleanupResourcesSync(actions: (() => unknown)[], reportError: (error: unknown) => void) {
  for (const action of actions) {
    try {
      action();
    }
    catch (error) {
      reportError(error);
    }
  }
}
