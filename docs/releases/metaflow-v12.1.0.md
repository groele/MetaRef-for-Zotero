# Zotero MetaFlow 12.1.0

Released on 2026-10-19.

## Added

- Normalize abstract formatting through Check and Fix Metadata and automatic formatting of newly imported items. The rule is enabled by default and can be disabled under Metadata Rules → Other Fields. Automatic execution also requires the existing new-item automation switch.
- Remove excess whitespace, indentation, zero-width spaces and standalone ABSTRACT / 摘要 headings; join wrapped lines within paragraphs while preserving paragraph breaks and existing inline markup. Conservatively join recognized chemical formula fragments split across isolated lines, such as WSe2/CuInP2S6 and Cu+.
- Provide a separate abstract-field menu action for existing items. Explicit execution remains available when the automatic rule is disabled.

## Fixed

- Reuse the same native bottom-right window from running progress through completion for core commands. Completion updates the existing window, hides the obsolete stop row, retains the five-second lifetime and opens the complete report only on request.
- Preserve stopping, keyboard report access and combined results across metadata, formatting and journal stages.

## Compatibility and verification

Backward compatible; no settings or storage migration is required. The add-on ID, MetaRef preference namespace, Gecko 140 build target and Zotero 10.0–11.x compatibility metadata remain unchanged. Exact current test results, package hashes and exercised host versions are recorded in `dist/verification.json`.

Abstract normalization saves the abstract field; it does not rewrite scientific wording or infer subscript/superscript placement for plain-text digits. Blank lines are retained when their meaning is ambiguous. Live provider availability and untested hosts are outside this release's verification scope.

## 使用说明

摘要规范化默认加入“检查并修复元数据”，无需单独执行。设置 → 元数据规则 → 其他字段 → “规范化摘要排版”可关闭；新导入文献的自动处理还受“新增条目时自动检查并整理”总开关控制。

整理中的右下角窗口会原位更新为完成结果，随后保留 5 秒，点击可查看详情，避免同一任务先后弹出两个窗口。
