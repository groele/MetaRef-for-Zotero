# Zotero MetaFlow 12.6.8

Rebalance the journal pane with consistent typography and right-aligned result values. Place deduplicated match details immediately above database versions, each on a single full-width line with an overflow tooltip. The ISSN number aligns with the right edge of result values beside the label“匹配依据·ISSN”. Remove redundant completion and saved-data notes from the visible panel. Hide the API fallback notice when local data is usable; keep actual errors and source details. API fallback information remains in debug logs.

27 focused unit tests and 9 isolated Windows Zotero source-loaded pane tests passed. Production build, TypeScript checks, ZIP/manifest and update-feed hash checks passed. Reviewed a native screenshot and checked 280px/360px widths without horizontal overflow. Dark theme, exact production-XPI installation, main-profile installation and automatic-update installation were not revalidated. Verification: dist/verification.json.
