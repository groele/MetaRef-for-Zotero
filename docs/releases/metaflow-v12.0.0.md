# Zotero MetaFlow 12.0.0

Released on 2026-10-19.

## Changes

- Search reports by title, item ID, rule, message or source. Filter items with warnings, errors or field changes. Render 25 item cards per page, with keyboard-accessible item navigation and an announced page count. Export always includes the complete report and all field changes.
- Yield local and cached batches to Gecko after an 8 ms budget or 64 checkpoints. Preparation, individual rules and item dispatch share the scheduler; cancellation is rechecked after yielding. Already completed rule changes retain the existing save boundary.
- Cancel the core workflow and rule runner together during plugin shutdown, then wait for both queues before flushing persistence.
- Evict shared requests when response processing throws, allowing the next lookup to recover.
- Preserve journal-index files written with a newer schema when downgrading. Fresh metrics can be used for the current session without rewriting the newer file.
- Disable report actions while their asynchronous operation is running to prevent repeated activation.

## Compatibility and migration

This is a user-requested major product milestone. There are no intentionally breaking preference, API or storage-schema changes. The add-on ID, MetaRef preference namespace and Gecko 140 build target remain unchanged. Existing settings require no migration. Zotero compatibility remains 10.0–11.x; exact exercised builds and languages are recorded in `dist/verification.json`.

## Verification

See `dist/verification.json` for the exact production XPI hashes, unit/native counts and package installation scope. The [audit](../major-version-audit-2026-10-19.md) distinguishes source inspection, regression evidence and remaining limits.

## 使用说明

点击完成通知或设置页的报告入口后，可搜索和按警告、错误、字段变更筛选。每页显示 25 个条目，上一页／下一页切换；导出 JSON 不受当前筛选和分页限制。界面通知仍沿用右下角原生进度及 5 秒完成提示。

## Rollback

Before reverting an installation, retain a backup of the Zotero profile and data directory. Install the previous Release XPI to roll back the add-on. This release does not migrate library records or preference keys. Downgrading cannot reverse metadata changes that were already saved; use Zotero's undo or your library backup for those changes.
