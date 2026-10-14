const controllers = new Map<Element, AbortController>();

export function preferenceListeners(pane: Element) {
  let controller = controllers.get(pane);
  if (!controller) {
    const win = pane.ownerDocument!.defaultView as Window & typeof globalThis;
    controller = new win.AbortController();
    controllers.set(pane, controller);
  }
  const signal = controller.signal;
  return <E extends Event>(target: Element, type: string, listener: (event: E) => unknown, options: boolean | AddEventListenerOptions = {}) => {
    target.addEventListener(type, listener as EventListener, {
      ...typeof options === "boolean" ? { capture: options } : options,
      signal,
    });
  };
}

export function releasePreferenceListeners(doc?: Document) {
  for (const [pane, controller] of controllers) {
    if (!doc || pane.ownerDocument === doc) {
      controller.abort();
      controllers.delete(pane);
    }
  }
}
