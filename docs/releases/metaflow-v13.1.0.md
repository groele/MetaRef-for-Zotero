# Zotero MetaFlow 13.1.0

**Release Date:** 2026-10-30
**Release Type:** Minor Feature Release (Semantic Scholar TL;DR AI Summary Extraction & Backfill)

## 📌 Summary

Zotero MetaFlow 13.1.0 integrates instant AI-powered scholarly takeaways extraction via Semantic Scholar's TL;DR (Too Long; Didn't Read) API directly into the "Update Metadata" pipeline, inspired by `syt2/Zotero-TLDR` with deep native evolution:

- **Integrated into "Update Metadata" Core Workflow**:
  - Automatically queries Semantic Scholar for 1–2 sentence AI summaries summarizing core contributions for papers with DOI, arXiv ID, or PMID.
  - Caches queries locally within the shared request cache to eliminate redundant network roundtrips.
- **Granular Storage Preferences**:
  - Configurable in Preferences under Pipeline Settings (`workflow.tldrEnabled`, `workflow.tldrTarget`).
  - Target choices:
    - **Dedicated Child Note (Recommended)**: Idempotently creates or updates a clean HTML child note (`💡 TL;DR 核心论点 (Semantic Scholar)`) with styled blockquote, preserving existing metadata purity.
    - **Extra Field**: Backfills `TLDR: ...` into the Extra field for direct table column visibility in Zotero.
    - **Dual Mode (Both)**: Writes to both child note and Extra field simultaneously.
    - **Abstract Self-Healing**: Fills empty `abstractNote` fields when missing.
- **Journal Insights Sidebar Card**:
  - Displays a dedicated `💡 核心论点 (TL;DR)` summary card in the right-hand Journal Insights panel for published papers and arXiv preprints.
- **Open-Source Derivatives & Upstream Acknowledgments**:
  - Formally acknowledges and credits `syt2/Zotero-TLDR` (by @syt2) across Chinese and English documentation.
- **Testing & Verification**:
  - Added full test suite `tldr.test.ts` covering note creation/update, Extra parsing/writing, abstract fill, HTML escaping, and complete workflow backfilling.
  - 90 unit test suites, 629 unit tests 100% passing.

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.1.0`
- **Bytes:** `3493579`
- **SHA-256:** `fc19a41cbe19741b37caa46323c0dd745102dd5b8577f831e8cbbcf9ac5fcdd8`
- **SHA-512:** `abf87720a0e552b52445e86cee71b6fbc719c27a18462dc5bd3b0f81a9f3a7db27110d92350f2ac238324f650e8752c7f21251b6c964cba75fed4d1243d354a8`
- **Quality Checks:** 90 unit test suites (629 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
