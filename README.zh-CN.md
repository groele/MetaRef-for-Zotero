<div align="center">

# Zotero MetaFlow

**智能校验、规范格式、丰富文献元数据与期刊学术指标**

[English](README.md) · [简体中文](README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-11.2.0-blue.svg)](https://github.com/groele/Zotero-MetaFlow/releases)
[![Zotero Compatibility](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-brightgreen.svg)](https://www.zotero.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/groele/Zotero-MetaFlow?include_prereleases&color=7289da)](https://github.com/groele/Zotero-MetaFlow/releases)

[📦 下载安装包 (.xpi)](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [🚀 快速开始](#-快速开始) · [💡 核心特性](#-核心特性) · [💖 开源项目致谢](#-开源项目声明与致谢) · [📝 问题反馈](https://github.com/groele/Zotero-MetaFlow/issues)

**Zotero Flow Series**

</div>

---

> **11.2.0 更新：**新增按判据自动填充元数据、多个重复组批量合并、完整命令调度与轻量反馈，以及独立的本地运行记录。功能变化及验证边界见[发布说明](docs/releases/metaflow-v11.2.0.md)，整体配置与数据位置见[功能与数据布局](docs/global-workflow-and-data-layout.md)。

> 11.2.0 新增统一本地／云端元数据优先级，以及可点击查看报告、5 秒后自动消失的完成通知。当前验收见发布说明；此前[审查台账](docs/commercial-readiness-2026-10-18.md)保留商业发行条件的边界。

## 📖 项目简介

**Zotero MetaFlow** 是专为 Zotero 设计的文献元数据治理与期刊指标管理插件（隶属于 Zotero Flow Series 生产力套件）。

日常科研中，从各大数据库、网页或 DOI 导入的文献元数据往往存在标题大小写混乱、作者姓名格式不一、缺失期刊缩写、无效字段冗余、缺少期刊学术评级等问题。Zotero MetaFlow 提供了 **58 项内置规则与工具**、**61 项 EasyScholar 期刊评价指标**、**Nature Index 2026 与 ESI 期刊清单本地快照**，以及**智能网络元数据自动补全**，让您的个人知识库井然有序、规范专业。

---

## ✨ 核心特性

### 1. 🧹 深度元数据清洗与规范化（58 项规则与工具）

- **标题格式规整**：支持将全大写或杂乱标题一键转换为规范的句首字母大写（Sentence case）或标题大写（Title Case），内置智能词典自动保护化学式（如 $\text{CO}_2$、$\text{H}_2\text{O}$）、基因命名、mRNA 及专有名词。
- **作者与创作者修复**：智能识别姓名前后颠倒、拼音转换与声调标注，剔除无效作者并修复作者角色。
- **DOI 标准化与 ShortDOI**：自动剔除多余 URL 前缀，验证 DOI 格式，并将 ShortDOI 解析为完整 DOI，同时在 Extra 中保留短标识符。
- **页码范围优化**：规范连接符为标准 en-dash（`-`），智能剔除多余的补零（例如将 `001-008` 或 `101--108` 修正为规范的 `101-108`）。
- **出版日期标准化**：统一规范为标准的 ISO 8601（`YYYY-MM-DD`）格式。
- **字段冗余与错用清理**：安全清理 `null`、`undefined` 等脏数据，去除标题多余的末尾英文句点，纠正非法字段错用（如论文条目误标为网页）。
- **出版地点与高校关联**：内置全球高校与所在城市关联数据库，自动补全硕博学位论文的出版地信息。

### 2. 📚 权威期刊缩写库与 ISO 4 支持

- **JabRef 权威期刊缩写数据库**：集成高质量标准学术期刊全称与缩写映射。
- **离线 ISO 4 推断算法**：基于国际标准的 LTWA（List of Title Word Abbreviations）规则集，在无网络连接时依然能精确推断期刊缩写。
- **语言自适应匹配**：区分中英文期刊，针对中文期刊提供专用拼音全称或规范缩写方案。

### 3. 📊 期刊学术分级与多维指标管理

- **全面对接 EasyScholar API**：完整支持多达 **61 项学术指标与权威分级**，包括中科院 JCR 分区、CCF 中国计算机学会推荐目录、SCI / SSCI、卓越行动计划、北大核心、CSSCI（南大核心）、CSCD（中科院核心）等。
- **主控权限统一隔离**：由设置页的指标开关集中管控远程 API 请求、侧栏面板展示、条目 Extra 字段回写以及主界面列表列的注册与展示。
- **Nature Index 期刊名单识别**：依据内置 2026 年度 177 种期刊快照匹配；期刊在名单内不等于每篇文章被计入，不表示官方认证或实时跟踪。
- **ESI 学科期刊权威数据库**：内置全球 ESI 学科收录期刊清单，支持期刊所属学科的本地识别。
- **Zotero 列表自定义列与原生排序**：支持将关注的期刊指标（如中科院分区、CCF 等级、Nature Index）添加为文献列表树的独立表格列，并支持原生的排序与分类。
- **专属期刊侧栏面板（Journal Insights）**：在条目详情右侧实时呈现期刊全景评级，提供直观的指标卡片与一键补全入口。
- **跨会话持久化缓存**：API 查询结果本地缓存 72 小时，支持重启跨会话复用，相同期刊并发合并查询，大幅节约 API 请求额度。

### 4. 🌐 智能网络元数据补全

- **多渠道精准补全**：支持基于 DOI、ISBN、arXiv ID、Semantic Scholar 等权威数据源自动补全文献出版信息。
- **精细化更新策略**：支持“仅补全空白字段（Blank-only）”与“按需覆盖（Overwrite）”模式，仅补空模式保留非空字段；覆盖模式按身份判据采用来源字段。
- **异步安全防护机制**：网络请求前后严格核验条目身份与作品变动，防止因长耗时异步请求导致的数据写回错位或条目类型错配。

### 5. 🛡️ 批处理与数据安全

- **串行批次队列与可控并发**：支持批量处理大量文献，并发度可在 1–16 之间自由设定，防止界面卡顿或请求过载。
- **条目修改日记（Item Mutation Journal）**：单条规则发生异常或超时将精准局部回滚，保障其他健康规则的正常生效。
- **事务保存与失败隔离恢复**：批量事务提交失败时自动重新加载条目快照并逐条安全重试。
- **可视化结果汇总报告**：默认以轻量状态条反馈，需要时主动打开详细报告，查看字段变更并导出 JSON；自动打开报告可在设置中启用。

### 6. ✍️ 标题富文本编辑工具栏

- 在 Zotero 标题编辑区域集成轻量富文本编辑栏，支持一键选区包裹 `<i>`（斜体 / 生物学名）、`<b>`（粗体）、`<sub>`（下标 / 化学式）、`<sup>`（上标）、`<span class="nocase">`（大小写保护标签）。
- 保持原生选区和编辑器光标聚焦，提供实时渲染预览。

---

## 🖥️ 运行环境与兼容性

| 项目                   | 说明                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------ |
| **插件版本**           | `11.2.0`                                                                              |
| **插件 ID**            | `metaflow@groele`                                                                     |
| **支持的 Zotero 版本** | `Zotero 10.0 – 11.*`（严格测试覆盖 Windows Zotero 10.0.6 与 Zotero 11 dev Gecko 153） |
| **操作系统**           | Windows / macOS / Linux                                                               |
| **环境依赖**           | 无需安装外部 Python 或 Node.js，纯 ESM 模块运行于 Gecko 运行时                        |

---

## 📦 安装指南

1. **下载插件**：前往 [Releases 页面](https://github.com/groele/Zotero-MetaFlow/releases) 或直接点击 [下载 zotero-metaflow.xpi](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) 获取最新安装包。
2. **打开 Zotero**：在顶部菜单栏依次点击 **工具 (Tools)** → **插件 (Plugins / Add-ons)**。
3. **安装插件**：点击右上角齿轮图标，选择 **Install Add-on From File...（从文件安装插件）**，选中下载的 `.xpi` 文件。
4. **重启生效**：根据 Zotero 提示完成安装并重启软件。

> 💡 **自动更新**：MetaFlow 通过 [update.json](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/update.json) 接收插件更新。

---

## 🚀 快速开始

1. **打开设置面板**：在 Zotero 菜单栏点击 **编辑 (Edit)** → **首选项 (Preferences)** → 选择 **MetaFlow** 标签页。
2. **配置常用规则**：
   - 勾选您希望自动或批量运行的元数据规则（如英文标题大小写、页码破折号、去除多余句点等）。
   - 若需自动整理新抓取的文献，可启用“文献新增时自动运行启用规则”。
3. **配置期刊分级（可选）**：
   - 如需使用 EasyScholar 获取中科院分区或 CCF 等级，在设置中填入您的 EasyScholar Secret Key。
   - 勾选您关注的指标（如中科院大类分区、JCR、Nature Index 等），并可选择是否在条目列表中显示对应列。
4. **执行整理**：
   - 选中一条或多条文献，右键执行 **Zotero MetaFlow：检查并修复元数据** 或 **Zotero MetaFlow：更新元数据**。在核心功能设置中选择可选步骤；低频专项工具保留在设置页。

---

## 🛠️ 本地开发与测试

本项目基于 `pnpm` 与 `zotero-plugin-scaffold` 现代工程链构建：

```bash
# 1. 克隆代码仓库
git clone https://github.com/groele/Zotero-MetaFlow.git
cd Zotero-MetaFlow

# 2. 安装项目依赖（推荐 pnpm 12+）
pnpm install

# 3. 运行单元测试
pnpm test:unit

# 4. 代码风格与拼写检查
pnpm lint:check

# 5. 构建生产发布包（输出至 .scaffold/build/）
pnpm build
```

---

## 💖 开源项目声明与致谢

Zotero MetaFlow 的诞生与演化深度依托开源社区的智慧与成果。在此特别声明并由衷感谢以下杰出的开源项目及作者：

### 核心灵感与上游开源项目

- **[northword/zotero-format-metadata](https://github.com/northword/zotero-format-metadata)**（Linter for Zotero）：
  本项目最初基于 northword 开发的 `zotero-format-metadata` 开源项目二次开发与演进。其开创性的元数据规则系统抽象（Rule System）与批量处理机制为本项目奠定了坚实的基础，由衷感谢原作者 northword 及其社区贡献者。
- **[zoushucai/zotero-journalabbr](https://github.com/zoushucai/zotero-journalabbr)**：
  特别感谢 zoushucai 老师的开源项目 `zotero-journalabbr`！该项目在 Zotero 期刊缩写规范化、期刊名称词表映射与学术数据整理方面的探索与设计，为本项目的期刊缩写模块和规则实现提供了宝贵的借鉴与启发。
- **[redleafnew/zotero-updateifsE](https://github.com/redleafnew/zotero-updateifsE)**：
  特别感谢 redleafnew 老师开发的 `zotero-updateifsE`！该项目在利用 EasyScholar API 获取中科院分区、影响因子、期刊评级与学术指标回写 Zotero Extra 字段等方面的开创性实践，为本项目 EasyScholar 61 项指标对接、权限主控及指标展示体系的设计提供了极其重要的参考与灵感。

### 插件工程框架与工具链

- **[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)**：由 windingwind 打造的现代 Zotero 插件开发模板与工程化规范。
- **[northword/zotero-plugin-scaffold](https://github.com/northword/zotero-plugin-scaffold)**：northword 开发的专业 Zotero 插件构建与脚手架工具链。
- **[windingwind/zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)**：功能强大的 Zotero 插件运行时 API 抽象与辅助库。

### 权威数据源与开放服务

- **[JabRef / abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org)**：提供了权威、全面、高质量的全球学术期刊全称与缩写对照数据集。
- **[EasyScholar](https://www.easyscholar.cc/)**：提供了便捷、高效的学术期刊分级与学术影响力开放查询服务。
- **[Nature Index](https://www.nature.com/nature-index/)**：施普林格·自然旗下权威自然科学科研产出评价体系。

### 核心开源依赖库

- **[es-toolkit](https://github.com/toss/es-toolkit)**：极致轻量、高效的现代 JavaScript 通用函数库。
- **[tinyld](https://github.com/mayankdugar/tinyld)**：轻巧快速的纯 JavaScript 语言检测库。
- **[tiny-pinyin](https://github.com/creeperyang/pinyin)**：快速精准的汉字转拼音工具库。
- **[p-throttle](https://github.com/sindresorhus/p-throttle)**：Sindre Sorhus 维护的经典异步速率限流工具。
- **[csvtojson](https://github.com/Keyang/node-csvtojson)**：高性能 CSV 格式解析与转换库。
- **[quote-quote](https://github.com/unindented/quote-quote)**：文本引号规范化工具。
- **[esbuild](https://github.com/evanw/esbuild)** / **[vitest](https://github.com/vitest-dev/vitest)** / **[eslint](https://github.com/eslint/eslint)** / **[autocorrect](https://github.com/huacnlee/autocorrect)**：为代码构建、单元测试、代码质量保证与中英文排版规范提供强劲支撑的工具链。

---

## 📄 开源许可证

本项目遵循 **[GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)](LICENSE)** 开源协议。

- 插件所有衍生的独立修改与新增功能均保持开放。
- 第三方组件、数据集和开源项目保留其原有版权声明与许可条款。
- Zotero 是 Corporation for Digital Scholarship 的注册商标，本项目为独立第三方插件，与 Zotero 官方无从属关系。
