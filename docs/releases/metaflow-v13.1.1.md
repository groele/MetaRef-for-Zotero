# Zotero MetaFlow 13.1.1

**Release Date:** 2026-10-31
**Release Type:** Patch Refinement Release (TL;DR Entity Decoding, Note Deduplication & UI Resilience)

## 📌 Summary

Zotero MetaFlow 13.1.1 thoroughly refines and polishes the Semantic Scholar TL;DR AI summary extraction pipeline, improving note format interoperability, HTML entity handling, UI resilience, and workflow dependency gating:

- **HTML Entity Decoding**:
  - Implemented `unescapeHTML()` in note extraction pipeline so entities like `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#039;`, and `&apos;` are decoded back to plain text, preventing raw entities from showing up in sidebar cards or the Extra field.
- **Interoperability with Existing Notes**:
  - Enhanced `findExistingTLDRNote()` and `extractTLDRFromNote()` to recognize notes originally created by `syt2/Zotero-TLDR` or notes without emoji prefixes (`TL;DR: ...`), updating them idempotently and preventing duplicate child notes.
- **Workflow Dependency & creatorsOnly Gating**:
  - In review mode, guarded TL;DR execution with `!features.creatorsOnly` so "Repair Creators" operations exclusively touch author fields without triggering unwanted AI summary fetches.
  - In Settings, linked `tldr.disabled` to `workflow.updateBibliographic` so pipeline dependencies toggle synchronously in the UI.
  - In `tool-update-metadata`, added self-healing backfill when general metadata services yield no field diffs, ensuring items with existing metadata still receive their TL;DR summary.
- **Sidebar Resilience**:
  - Enhanced `supportsSection()` in `journal-pane.ts` to surface the TL;DR card even when EasyScholar metrics are disabled or not yet configured.
  - Omitted empty journal metrics placeholders when EasyScholar is turned off, keeping the sidebar card minimalist and distraction-free.
- **Non-Regular Item Protection**:
  - Added strict `isRegularItem()` checks across all note, extra, and backfill methods to protect child notes, snapshots, and attachments from accidental modification.
- **Testing & Verification**:
  - Expanded unit test suite in `tldr.test.ts` (90 test suites, 631 unit tests 100% passing).

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.1.1`
- **Bytes:** `3493932`
- **SHA-256:** `9fc25894a36b9858def9ad50de97e912890f744a4eb380d3ef55f52206cb431b`
- **SHA-512:** `e3913320c0a99169efee22f8cb92d0ca30be441c897456a6621cf19aaf8023a28572d6b8aeeb440b10ce666a10c412a3965798d0283c0246ca60be8fb66ad9d5`
- **Quality Checks:** 90 unit test suites (631 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
