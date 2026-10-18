interface PersistencePhase {
  addBlocker: (name: string, condition: () => Promise<void>) => void;
  removeBlocker: (condition: () => Promise<void>) => unknown;
}

/** Gecko waits for profile writes here even when add-on APP_SHUTDOWN skips normal cleanup. */
export function registerPersistenceShutdown(flush: () => Promise<void>, phase?: PersistencePhase) {
  const target = phase || (ChromeUtils.importESModule("resource://gre/modules/AsyncShutdown.sys.mjs") as { AsyncShutdown: { profileBeforeChange: PersistencePhase } }).AsyncShutdown.profileBeforeChange;
  target.addBlocker("Zotero MetaFlow: flush local runtime data and caches", flush);
  return () => {
    target.removeBlocker(flush);
  };
}
