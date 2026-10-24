# Zotero MetaFlow 12.5.3

Do not start queued preparation after cancellation in the same event turn. Observe eager shared-request rejection even when its last subscriber cancels before waiting; keep active-subscriber error propagation unchanged.

## Validation

- 85 files / 555 unit tests passed with no unhandled rejection; production build, TypeScript and changed-file ESLint passed.
- Five final candidate XPIs loaded together in an isolated Windows Zotero 10.0.6 profile; initial 11/11 and restart 11/11 controlled checks passed.
- Lifetime helper checks use bundles from the maintained sources; clipboard failure is controlled. These do not establish all external-service, theme, OS clipboard or Word integration behavior.
- User main-profile installation and automatic-update installation were not performed. Compatibility declarations were not broadened.

