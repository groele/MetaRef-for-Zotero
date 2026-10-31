# Zotero MetaFlow 13.3.4

**Release Date:** 2026-10-31
**Release Type:** Patch Release (Native Info Pane "撷论" Row & Inline Editing)

## 📌 Summary

Zotero MetaFlow 13.3.4 针对文献详情右侧侧边栏的核心体验进行了重要演进与体验补全：

- **右侧侧边栏「信息」面板常驻呈现「撷论」行 (Native Item Info Pane "撷论" Row)**：
  - 基于 Zotero 7 原生 `Zotero.ItemPaneManager.registerInfoRow` 架构标准，在条目详情右侧侧边栏顶层核心区域——「信息（Info）」面板中，正式注册原生的「撷论」信息行；
  - 采用 `position: "start"` 布局锚点，与主流生态（如 Ethereal Style / Zotero Style）的「简记」行齐平并列于信息面板顶部（条目类型之前），直观显眼，免除向下滚动查找；
  - 支持 `multiline: true` 与自动换行（`nowrap: false`），即使 1~2 句较长的核心贡献与论点摘要也能自适应整洁排版；
  - 开启 `editable: true` 内联编辑支持：用户既可在更新元数据时全自动从 Semantic Scholar 回填，也可直接在侧边栏「信息」面板中双击/点击手动修订或补充心得，修改将自动同步至条目 Extra 字段（兼容主流 `remark:` 或 `TLDR:` 格式）与权威子笔记；清空内容时亦可智能清理对应速记标记；
  - 新增设置选项 `workflow.tldrShowInInfoPane`（默认开启），由用户自主决定是否在右侧「信息」面板显示该行。
- **全生态列与面板多端实时联动 (Multi-pane Real-time Synchronization)**：
  - 当更新元数据提取论点或手动修订「信息」栏时，自动同步触发中间条目列表的「撷论」列与「简记」列刷新（`ItemTreeManager.refreshColumns`）；
  - 同时自动联动通知「期刊洞察」侧边栏卡片（`metaref-journal-insights`）及其他打开视图，实现全库多端一致的文献论点工作流。
- **质量与工程验证**：
  - 全量 Vitest 测试套件：92 个测试文件，659 项测试 100% 通过（新增 `item-info-row.test.ts` 8 项测试以及 `tldr.test.ts` 内联修改保存测试）。
  - TypeScript 严格类型检查（`tsc --noEmit`）通过。
  - ESLint 代码检查与 AutoCorrect 格式化 0 错误 0 警告。
  - Release-tags 标签自检工具 100% 通过。

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.3.4`
- **Bytes:** `3501877`
- **SHA-256:** `04512766549b5b1150826c7ddf3979d9444a78b935e6d89eacd8699c33b659ef`
- **SHA-512:** `bd4a49355cb510248622f40160053dd680d33162a7c344ebe07dd6950e9d30eaeb504651dd1bc23e36bae39841dea3277848f6fdfe156ecf60e1228445de68c9`
- **Quality Checks:** 92 unit test suites (659 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
