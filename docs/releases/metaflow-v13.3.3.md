# Zotero MetaFlow 13.3.3

**Release Date:** 2026-10-31
**Release Type:** Patch Release (TL;DR Extra Deduplication & Non-Journal Sidebar Layout Polish)

## 📌 Summary

Zotero MetaFlow 13.3.3 对前序新增功能进行了更深入的代码审视、边界防护与视觉体验完善：

- **Extra 字段速记去重与幂等净化 (Extra Field Deduplication & Clean Serialization)**：
  - 在 `saveTLDRToExtra` 中新增行级去重机制：当条目中存在历史遗留的多条速记（如同时存在旧版 `TLDR:` 与新版 `remark:`）时，自动清理陈旧冗余行，确保 Extra 附加信息中只保留唯一权威的论点前缀行；
  - 增强空摘要安全防线，杜绝空白论点写入污染；
  - 在 `extractTLDRFromItem` 中优先解析带有 `data-metaflow-tldr="true"` 或 Semantic Scholar 标识的权威子笔记，防止用户个人普通笔记（可能偶然包含“简记”关键词）误覆盖论文核心论点。
- **非期刊类文献侧边栏布局精细化 (Non-Journal Sidebar Layout Polish)**：
  - 优化非期刊类文献（书籍、报告、学位论文等）在「期刊洞察」侧边栏的展示逻辑：当条目不具备期刊/会议评价属性且无索引评价时，隐藏冗余的空「期刊评价」区块，直接呈现顶层条目题名与 `💡 核心论点 (TL;DR)` 卡片；
  - 标题降级保障：当文献无出版物字段（如独立专著或部分快照）时，智能回退为文献题名展示，避免误显「未命名期刊」；
  - 快照复活卡片与徽标视觉样式对齐原生主题变量 `--accent-blue`，全面增强暗色模式（Dark Mode）与高对比度下的视觉一致性；
  - 增强快照 URL 协议有效性校验，避免非 HTTP(S) 地址生成无效超链接。
- **质量与工程验证**：
  - 全量 Vitest 测试套件：91 个测试文件，650 项测试 100% 通过（新增 2 项测试覆盖多行 Extra 去重整合与权威笔记识别优先级）。
  - TypeScript 类型校验、ESLint 代码检查与 AutoCorrect 格式化 0 错误 0 警告。
  - Release-tags 标签自检工具 100% 通过。

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.3.3`
- **Bytes:** `3500523`
- **SHA-256:** `4dde0da820f77ff734540d8628c341b732d8f51c22338faa3332730b2d2919e5`
- **SHA-512:** `15bc544b20c1cb85ef0eb5d007709e2ced56d050c5bf98b8e1c5103d9ede2b78cf112386ad0eb986ef0aec60a9e3f0e72b775b34480d64c7a49f132f89a1d70a`
- **Quality Checks:** 91 unit test suites (650 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
