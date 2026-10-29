# Zotero MetaFlow 12.6.8

Rebalance the journal pane with consistent typography and right-aligned result values. Place deduplicated match details immediately above database versions, each on a single full-width line with an overflow tooltip. The ISSN number aligns with the right edge of result values beside the label“匹配依据·ISSN”. Remove redundant completion and saved-data notes from the visible panel. Hide the API fallback notice when local data is usable; keep actual errors and source details. API fallback information remains in debug logs.

27 focused unit tests and 9 isolated Windows Zotero source-loaded pane tests passed. Production build, TypeScript checks, ZIP/manifest and update-feed hash checks passed. Reviewed a native screenshot and checked 280px/360px widths without horizontal overflow. Dark theme, exact production-XPI installation, main-profile installation and automatic-update installation were not revalidated. Verification: dist/verification.json.

The native duplicate-popup visual fixture now fits its parent window within the available desktop and waits for resizing before checking popup placement. Original edge-distance assertions are retained. Its 11 isolated Windows tests passed.

Native duplicate notifications now retile after their window resize event, so placement uses the updated size. The listener is removed on close. An additional isolated 17-test duplicate/recovery run passed; preference style assertions wait for stylesheet application.
