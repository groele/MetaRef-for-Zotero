# Zotero MetaFlow 13.3.1

**Release Date:** 2026-10-31
**Release Type:** Patch Release (Global Architecture Review, Performance Optimization & Code Cleanup)

## 📌 Summary

Zotero MetaFlow 13.3.1 针对跨插件集成模块进行了全局架构审视与深度治理优化，消除执行低效与双轨制不兼容隐患，清理历史遗留冗余代码，并统一工程代码风格：

- **去重索引性能跃升 (Deduplication Lazy Resolution)**：
  - 将 `src/modules/review/duplicates.ts` 中全库条目索引阶段的 `preprint` 判定改造为按需懒加载（Lazy Getter）；
  - 在大规模文献库（万条级条目）检索去重时，彻底消除对非候选条目执行高开销的 `extractIdentifiers` 与 `ExtraField` 解析，全库扫描速度获得数倍至数十倍提升。
- **元数据审查流水线统一治理 (Unified Review Pipeline Alignment)**：
  - 修复 `src/modules/rules/no-article-webpage.ts` 错误链接动作遗漏 `{ review: true }` 标记的问题，使其与右键核心主流程保持一致，统一分流至具备完备冲突决策、审计日志、快照复活与 TL;DR 回填的 `core-workflow` / `ReviewProposal` 审查流水线，消除双轨执行不一致。
- **废弃遗留代码清理与代码规范统一 (Legacy Codebase Cleanup)**：
  - 清理并移除历史遗留且未使用的模版脚手架文件 `src/modules/rules/_template.ts`；
  - 净化 `src/utils/str.ts`：移除自循环导出 `export * as StringUtil from "./str"`、清理失效注释代码与历史标注，转为规范 TSDoc 注释。
- **质量与工程验证**：
  - 全量 Vitest 测试套件：91 个测试文件，644 项测试 100% 通过。
  - TypeScript 类型校验、ESLint 规则与 AutoCorrect 格式化 0 错误 0 警告。
  - Release-tags 标签自检工具 100% 通过。

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.3.1`
- **Bytes:** `3498685`
- **SHA-256:** `a6ba68f46284827c991a7e79f40fcd289364310fd905ae200cfbff0239d4a403`
- **SHA-512:** `bb1a633c866b42a4bc24b803830a4c5e05a1e398c7fe0b52210f7794ac647870bfd9ec0f4c80b9107c60bb00dee8716b002bc81d7b203f2fb9106f78391732c0`
- **Quality Checks:** 91 unit test suites (644 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
