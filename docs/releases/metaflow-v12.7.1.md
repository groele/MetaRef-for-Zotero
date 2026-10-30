# Zotero MetaFlow 12.7.1

- Fix collapsed journal-index section height: prevent body padding from maintaining residual vertical space when folded.
- Keep `[data-type="body"]` padding at 0, transfer content padding to the internal `.metaref-journal-pane-wrap` container, and inject scoped CSS to enforce zero body height and padding when `:not([open])`.
- When collapsed, the journal section body now shrinks cleanly to 0px, matching the native single-row header height (~24px).
- Extend declared Zotero compatibility range upper bound from `11.*` to `12.*` (`strict_max_version: 12.*`).

Validation: production build, TypeScript typecheck, unit tests, and lint checks passed.
