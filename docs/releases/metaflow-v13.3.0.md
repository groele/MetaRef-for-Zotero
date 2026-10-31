# Zotero MetaFlow 13.3.0

**Release Date:** 2026-10-31
**Release Type:** Minor Feature Release (Web Snapshot & Blog Reviver 一键复活残缺网页快照)

## 📌 Summary

Zotero MetaFlow 13.3.0 正式将**“网页快照与残废条目一键复活”（Web Snapshot / Blog Reviver）**深度集成至「更新元数据」工作流，彻底解决随手剪藏导致的网页死数据痛点：

- **网页快照与残缺条目“一键复活” (Web Snapshot & Blog Reviver)**:
  - 针对浏览器插件随手剪藏抓取成的简陋 `webpage`（网页）或 `blogPost`（博客帖子），实现深度学术特征嗅探与正规化升级。
  - **三级级联学术指纹嗅探 (`discoverSnapshotIdentifiers`)**：
    1. **URL 深度指纹解析**：识别直接 DOI、Nature/Nature News（如 `10.1038/d41586-...`）、arXiv ID（如 `2403.12345`）、PubMed PMID / PMCID 等；
    2. **关联 HTML 快照 `<head>` 精准探针**：解析已下载快照或网页头部中的 `<meta name="citation_doi">`、`<meta name="dc.identifier.doi">`、`<meta name="citation_arxiv_id">`、`<meta name="citation_pmid">`、`<link rel="canonical">` 等规范学术元标签，严格过滤正文引用噪音；
    3. **在线网页头部回退**：按需快速嗅探页面头部的规范学术标识。
  - **学术级元数据反查与结构升级**：
    - 联动 Crossref 与 Semantic Scholar 反查完整学术元数据；
    - 自动将 `webpage` / `blogPost` 条目升级为正规 `journalArticle`（期刊文章）或 `preprint`（预印本）；
    - 全面补齐作者列表、期刊名称、出版年份/日期、卷号、期号、页码、DOI 等关键字段。
  - **无损传承与溯源保护 (Provenance Extra)**：
    - 条目类型升级时完整保留原始网页标题与 URL，并在 `extra` 附加字段中记录审计信息（`MetaFlow revived from: ...`），确保数据资产零丢失。
  - **集成至「更新元数据」与用户自主开关**：
    - 深度整合到「更新元数据」评审与自动化处理链路中；
    - 在「常规设置」与工作流设置中新增「复活网页快照与博客条目」选项，由用户决定是否启用。
- **质量与工程验证**：
  - 新增专用单元测试套件 `src/modules/review/snapshot-reviver.test.ts`（12 项测试全面覆盖 URL 解析、Nature News 映射、HTML meta 探针、正文噪音过滤与 Extra 溯源）。
  - 全量 Vitest 测试套件：91 个测试文件，644 项测试 100% 通过。
  - TypeScript 类型校验、ESLint 规则与 AutoCorrect 格式化 0 错误 0 警告。
  - Release-tags 标签自检工具 100% 通过。

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.3.0`
- **Bytes:** `3498640`
- **SHA-256:** `844652b1e90a5128d1c4d1fdd5985621e368cfd31d41448140fb8cf13884c95e`
- **SHA-512:** `a4320c71f47955c1acac81271a04fa85c05ca35e6c75ce658218e6df45f933a7c743edfc6a80bfefadb2ff9242f72535f193268acc827fa03239fde842505d9b`
- **Quality Checks:** 91 unit test suites (644 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
