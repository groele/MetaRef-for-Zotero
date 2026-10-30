# Zotero MetaFlow 12.7.0

- Advance the stable package version to 12.7.0. This release carries the collapsed journal-index header height correction introduced in 12.6.27; it contains no additional behavior changes.

Validation: package build, TypeScript, unit tests, lint, XPI manifest/version, ZIP CRC, update feed URL and SHA-512 are recorded in `dist/verification.json`.

Limits: no supported isolated Zotero 10/11 host is configured. No main profile or automatic update installation is performed as part of this release.

GitHub release workflow and asset verification passed. GitHub CI test run 41015363943 failed twice: the first run had 215 passing and 2 failing E2E tests; the rerun had 214 passing and 3 failing tests. Both runs failed two journal insight API fixture cases; the rerun also timed out in the ISSN snapshot integrity case. The release commit contains no runtime source changes. See dist/verification.json for package and release evidence.
