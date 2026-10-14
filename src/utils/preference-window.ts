/** Zotero dispatches a non-bubbling load after inserting a preferences fragment. */
export function watchPreferencePane(win: Window, rootID: string, initialize: (win: Window) => void) {
  const onLoad = (event: Event) => {
    if ((event.target as Element | null)?.id === rootID)
      initialize(win);
  };
  win.document.addEventListener("load", onLoad, true);
  try {
    if (win.document.getElementById(rootID))
      initialize(win);
  }
  catch (error) {
    win.document.removeEventListener("load", onLoad, true);
    throw error;
  }
  return () => win.document.removeEventListener("load", onLoad, true);
}
