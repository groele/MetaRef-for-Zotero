# Zotero MetaFlow 12.6.0

Date: 2026-10-27.

## Added

- Add **Merge all duplicates in this library** below Zotero's native Duplicate Items merge button.
- Scan all native duplicate groups in the active library, including host-detected ISBN matches, and confirm the batch once before changing items.
- Show progress and a persistent result summary below the item list; allow cancellation between groups and dismiss the summary after completion.
- Keep the existing master-item strategy, fill empty fields, combine unique Extra lines, and delegate attachment, note, tag, collection, relation and Undo handling to Zotero's native merge transaction.
- Skip mixed-type, non-duplicate, read-only, stale or concurrently edited groups and report skipped and failed groups separately.

## 新增功能

- 在 Zotero 原生“重复条目”合并按钮下方增加“一键合并当前库全部重复项”。
- 一次扫描当前文库的全部原生重复组，包含 Zotero 识别的 ISBN 重复项，统一确认后批量执行。
- 在条目列表下方持续显示进度和结果摘要，支持逐组取消并在完成后手动关闭摘要。
- 沿用现有主条目策略，自动补齐空字段、合并不重复的 Extra 行；附件、笔记、标签、集合、关联和撤销由 Zotero 原生合并事务维护。
- 不同类型、非重复标记、无写权限、过期快照或并发修改的组会跳过，并分别统计跳过和失败。

## Validation and scope

587 unit tests passed. Production build, TypeScript checks, ESLint, AutoCorrect and release-tag self-tests passed. The full Windows Zotero 10.0.6 / Gecko 140 / zh-CN E2E run passed 213 checks, including the production-package installation flow.

The production XPI passed 3 isolated initial checks and 3 restart checks. The installed package processed 3 duplicate groups and merged 4 duplicate items while preserving child notes, attachments, tags and collections. Light/dark and normal/narrow views passed with a 14px button and no local horizontal overflow.

Zotero 11 new-feature acceptance, macOS/Linux, screen-reader output, fresh empty-database startup, main-profile installation and automatic-update installation were not performed. Provider responses in unrelated existing tests were controlled. The package was built and installed in an isolated profile; no user main profile was changed.

## Package

- Asset: `zotero-metaflow.xpi` (3,476,699 bytes), add-on ID `metaflow@groele`, version `12.6.0`.
- SHA-256: `66c6fdecbf1c2c9c0e712a12679827b9fdd029ee82a6813ecbb99d6437fa1668`.
- SHA-512: `7302de48e9c3a1f7e207a8fc494f2a0271853a806c6fbe290b594631783fcd3133721c016a12d36ce8206d0b2c03ae9458c15387e55faa4bf371614ad6715d67`.
- The update feed points to the immutable `v12.6.0` Release asset and uses the matching SHA-512 hash.
- Details: [dist/verification.json](https://github.com/groele/Zotero-MetaFlow/blob/v12.6.0/dist/verification.json).
