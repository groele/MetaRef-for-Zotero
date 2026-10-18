# Zotero MetaFlow 11.0.0

This major release brings metadata verification, preprint version tracking and duplicate review into two focused workflows. Settings for the integrated features now live in the MetaFlow preferences panel.

## What's new

- **Review and enrich references:** inspect proposed metadata from DOI and other supported sources, choose which fields to apply, and preserve local values when a field is excluded.
- **Track publication versions:** connect preprints with published records, review changes before applying them, and recover safely when a related-version operation fails.
- **Review duplicates:** use configurable default and primary-item policies, preview decisions, and batch controls for pause, resume and cancel.
- **Two core commands:** expose the common review and metadata-cleanup workflows directly from the item menu, while keeping slower or specialized tools optional.
- **Unified settings:** consolidate duplicate-review options and integrated-workflow controls; dependency changes and setting persistence are covered by native host checks.
- **Zotero 11 compatibility:** use the current plural selection APIs and reject ambiguous multi-library duplicate operations.
- **Reliability:** report related-version outcomes, restore only affected relationship data after failures, and refresh duplicate statistics when their setting changes.

## Upgrade

The add-on ID (`metaflow@groele`) and preference namespace remain unchanged. Existing users can update through Zotero; no settings migration is required. The major version marks the new integrated workflow and settings experience.

## Verification

490 unit tests across 75 files, ESLint, AutoCorrect, TypeScript/build, whitespace checks and settings-binding audits passed. The final production XPI passed all 152 native end-to-end checks, including installation and bundled-data loading, on Windows Zotero 10.0.6 / Gecko 140. Settings and affected modules were also exercised in separate focused runs on Zotero 10.0.6 and Zotero 11.0-dev.5+dac1ad489 / Gecko 153; the latest targeted run on each host passed 17/17. The release evidence and XPI SHA-256 are recorded in `dist/verification.json`.

The checks do not establish compatibility with every third-party plugin combination, macOS/Linux, all external provider permissions, or long-running large-library workloads. Zotero 11 coverage applies to the named development build. The original-plugin coexistence matrix remains untested, so this release is not described as universally compatible or perfect.
