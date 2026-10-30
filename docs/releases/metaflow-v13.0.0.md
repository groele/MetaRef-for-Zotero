# Zotero MetaFlow 13.0.0

- Major version release: architecturally decouples the sidebar item-pane section container from body padding, completely eliminating residual vertical space when collapsed/folded.
- Zero out padding and margins on `[data-type="body"]`, delegate all spacing to the internal `.metaref-journal-pane-wrap` wrapper, and inject scoped CSS styles enforcing zero height, margin, and padding when `:not([open])`.
- Automatically hide empty section summaries across `onInit`, `onItemChange`, and `onRender` cycles to preserve clean single-row header alignment (~24px).
- Add error boundary and graceful fallback in `render()` to handle missing or failed ranking queries without breaking the section container.
- Safeguard `onRender()` from leaving dangling loading states on unsupported item selections.
- Constrain right-rail sidenav button dimensions (`item-pane-sidenav .btn[data-pane*="metaref-journal-insights"]`) consistently with the Zotero Flow suite.
- Extend declared Zotero compatibility range upper bound to `12.*` (`strict_max_version: 12.*`, covering Zotero 10.0 through 12.*).

Validation: production build, TypeScript typecheck, unit tests (88 test files, 611 tests), ESLint, and AutoCorrect passed.
