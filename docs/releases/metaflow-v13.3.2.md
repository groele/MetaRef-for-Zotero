# Zotero MetaFlow 13.3.2

**Release Date:** 2026-10-31
**Release Type:** Patch Release (TL;DR "简记" Interoperability & Web Snapshot Reviver Card Integration)

## 📌 Summary

Zotero MetaFlow 13.3.2 进一步深化新集成功能（arXiv 预印本转正、Semantic Scholar TL;DR 核心论点、网页快照复活）之间的交互闭环与生态互通：

- **深度联动「简记」列与 Ethereal Style (Remark Column Interoperability)**：
  - 全面支持学术论点回填与流行插件（如 Ethereal Style / Zotero Style）的「简记」列联动；
  - 自动识别 Extra 字段中的 `remark:`、`简记:`、`TLDR:`、`撷论:` 等前缀，支持多源论点提炼与直观展示；
  - 设置中新增 Extra 写入格式配置项（默认推荐 `remark:`，亦支持标准学术前缀 `TLDR:`），更新元数据时回填的论点可直接点亮用户列表中勾选的「简记」列，无需在「撷论」与「简记」之间做出妥协；
  - 原生「撷论」列亦支持读取 `remark:` 字段，为未安装其他增强插件的用户提供完全开箱即用的原生列表概括体验。
- **期刊洞察侧边栏集成「网页快照一键复活」卡片 (Web Snapshot Reviver Card)**：
  - 选中网页快照或博客条目时，侧边栏「期刊洞察」面板自动激活并呈现专属的「网页快照 / 剪藏条目」卡片；
  - 展示快照来源域名、条目标题、语义论点（若有）以及醒目的「⚡ 一键嗅探并复活为学术论文…」交互按钮，用户无需在右键多层菜单中寻找入口，即可在侧边栏一键触发三级嗅探与文献升级；
  - 复活成功后，条目在期刊洞察面板顶部展示「🌐 已由网页快照复活」徽标（与「已由 arXiv 转正」并列），形成清晰的学术文献溯源背书。
- **质量与工程验证**：
  - 全量 Vitest 测试套件：91 个测试文件，648 项测试 100% 通过（新增 4 项测试覆盖 remark / TLDR 双前缀及侧边栏快照状态检测）。
  - TypeScript 类型校验、ESLint 代码检查与 Prettier / AutoCorrect 格式化 0 错误 0 警告。
  - Release-tags 标签自检工具 100% 通过。

## 📦 Package Verification

- **Package:** `zotero-metaflow.xpi`
- **Version:** `13.3.2`
- **Bytes:** `3500279`
- **SHA-256:** `6ef6009dfbb97e375e2d54ee49ecfa3cd3ff2260b3eadf0aa9a7bc96e31749d6`
- **SHA-512:** `0a336f224674ce6be214609e3dac8ba90b5f3f826a7d1ecdb9161f6bfba94defba0d83af843c6618c968c95176ae0f5aff7cbc57d1c7b75abd6ab38220edb8f2`
- **Quality Checks:** 91 unit test suites (648 tests passed), TypeScript build passed, ESLint & AutoCorrect passed, release-tag self-test passed.
