# Zotero MetaFlow 13.0.3

**Release Date:** 2026-10-30
**Release Type:** Patch Feature Release (arXiv Preprint-to-Published Workflow Highlight)

## 📌 Summary

Zotero MetaFlow 13.0.3 natively integrates the **arXiv Preprint-to-Published Workflow** as a flagship highlight of MetaFlow, deeply inspired by `AllanChain/zotero-arxiv-workflow`:

- **Dedicated arXiv Preprint Sidebar Card**:
  - Automatically identifies arXiv preprints (via `arxiv.org` URL, `archiveID`, or `arXiv:` identifiers).
  - Displays a clean arXiv status card in the Journal Insights panel with official links and a prominent `⚡ 检查并转为正式发表版本…` action button.
- **Top-Level Context Menu Placement**:
  - Elevated `tool-review-preprint` into `CORE_COMMANDS` and primary context menu, enabling instant one-click conversion on single or batch selections.
- **Dual Lossless Conversion Modes**:
  - **In-Place Seamless Upgrade**: Converts `preprint` to `journalArticle` or `conferencePaper` with official publisher DOI, volume/issue/pages, while preserving 100% of attached PDFs, highlights, annotations, notes, and tags, recording the original arXiv identifier in `Extra`.
  - **Create Related Version**: Retains preprint and creates a new formal publication entry linked via bidirectional Zotero relations.
- **Provenance & Converted Badge**:
  - Converted papers display a green `arXiv 已转正` badge in the Journal Insights header.
- **Documentation & Open-Source Acknowledgment**:
  - Comprehensive feature highlights, workflow diagram nodes, quick-start use cases, settings descriptions, and enhanced acknowledgments for `AllanChain/zotero-arxiv-workflow` across Chinese and English documentation.

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.0.3`
- **SHA-256:** `817af459888317fc7eda4ff3357a6ba6addaf4d3ba6ea8ca2992990bd80b2d73`
- **SHA-512:** `9562d717600254140da73215ab5939c2e6aa0e4e59479b3283a0153e2cdb8c8018169e3e5365767bea58fecccfcbdf2f308e8d3c1e94f9178384f6b0baf8c5fb`
- **Quality Checks:** 88 unit test suites (611 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
