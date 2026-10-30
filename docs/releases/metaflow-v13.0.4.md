# Zotero MetaFlow 13.0.4

**Release Date:** 2026-10-30
**Release Type:** Patch Refinement Release (Seamless Workflow Embedding & Menu De-clutter)

## 📌 Summary

Zotero MetaFlow 13.0.4 refines the preprint-to-published workflow by seamlessly embedding preprint detection into the core "Update Metadata" pipeline, eliminating redundant context menu items and providing granular user preference controls:

- **Embedded into "Update Metadata" Core Workflow**:
  - Automatically identifies whether an item is an unconverted preprint via `isUnconvertedArxivPreprint(item)`.
  - Only triggers the preprint conversion workflow when an unconverted preprint is detected; ordinary journal or conference papers undergo standard metadata update safely without false-positive preprint prompts.
- **Context Menu Simplification**:
  - Removed redundant `tool-review-preprint` standalone context menu item from `MENU_SECTIONS.primary` and `CORE_COMMANDS`, keeping the right-click menu minimalist and zero-clutter (focusing on `standard` and `tool-update-metadata`).
- **User Preference Configuration**:
  - Surfaced the `workflow-update-versions` toggle in the settings panel under pipeline settings (`workflow.updateVersions`), enabling users to fully control whether preprint conversion is automatically engaged during metadata updates.
- **Sidebar Integration**:
  - Updated the arXiv Preprint card button in the Journal Insights sidebar to invoke `tool-update-metadata` with review mode enabled.
- **Robust Isolation & Testing**:
  - Eliminated runtime dependency on `ztoolkit` globals during identifier extraction for clean environment execution.
  - Added full test suite `journal-pane-preprint.test.ts` (89 test suites, 620 unit tests 100% passing).

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.0.4`
- **Bytes:** `3490306`
- **SHA-256:** `e5af21358228ec351ca9b9aca5244b5110848b9edb8f3ab693b578bcac6d55d4`
- **SHA-512:** `1defa94563d2b15a0ea0a361cea914274d1a066b496c5c8bacfc7dd1ab064df516f7bf135b950cbf26d5d04c68cc61cb02027edc35b637474385f9cc84366471`
- **Quality Checks:** 89 unit test suites (620 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
