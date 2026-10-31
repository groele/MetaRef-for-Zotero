# Zotero MetaFlow 13.2.0

**Release Date:** 2026-10-31
**Release Type:** Minor Feature Release (Custom "撷论" TL;DR Library Column & Dynamic Sync)

## 📌 Summary

Zotero MetaFlow 13.2.0 registers a dedicated custom column **“撷论”** (English: **"TL;DR Takeaway"**) directly in Zotero's library list view (`ItemTreeManager`), displaying the extracted Semantic Scholar TL;DR AI core takeaway inline in the main table with real-time UI refresh:

- **Custom Library Column "撷论" (TL;DR Takeaway)**:
  - Registered custom column `dataKey: "tldr"` via `Zotero.ItemTreeManager.registerColumn()`.
  - Available in Zotero's primary column picker context menu (alongside standard fields like "缩写" and "简记").
  - Persistent width, sort direction, and visibility via `zoteroPersist`.
- **Intelligent Multi-Source Data Provider**:
  - `dataProvider` dynamically retrieves the TL;DR takeaway from `item` via `extractTLDRFromItem()`.
  - Seamlessly extracts summary text from Extra (`TLDR:`, `TL;DR:`, `tldr:`, `撷论:`, `撷论：`) as well as child notes (`<div data-metaflow-tldr>`, `💡 撷论`, `TL;DR 核心论点`, `syt2/Zotero-TLDR`).
- **Real-Time Column Refresh**:
  - When TL;DR is backfilled and saved, automatically triggers `Zotero.ItemTreeManager.refreshColumns()` to update the "撷论" column in the table immediately without requiring a library reload or restart.
- **Preference & Localization Alignment**:
  - Added Fluent localization for `field-tldr` (`撷论` in Chinese, `TL;DR Takeaway` in English).
  - Clarified Backfill Target options in Preferences, indicating that backfilling to child note or Extra automatically reflects in the "撷论" column.
- **Quality & Verification**:
  - 90 unit test suites (632 tests 100% passing).
  - TypeScript build, ESLint, AutoCorrect, and release-tag self-test 100% passing.

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.2.0`
- **Bytes:** `3494330`
- **SHA-256:** `8b82f24a47be22c2743352ca3fee3ceb0f6f3940e279c5be259932c1d41a8577`
- **SHA-512:** `0ea7bc6a002acd69406397ffddf6773b843a77efd7d95dc69e0afcd5a5f8d5e1751e387854e8200199bded2b3113578c74606a12620e75bdd9314e4193dcd05d`
- **Quality Checks:** 90 unit test suites (632 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
