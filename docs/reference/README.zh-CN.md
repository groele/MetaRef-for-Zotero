> 原详细指南，保存于 2026-10-21。历史版本与验证范围按原记录理解；当前安装入口见 [README](../../README.md)。

<div align="center">

# Zotero MetaFlow

**智能校验、规范格式、丰富文献元数据与期刊学术指标**

[English](../../README.md) · [简体中文](../../README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-12.1.0-blue.svg)](https://github.com/groele/Zotero-MetaFlow/releases)
[![Zotero Compatibility](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-brightgreen.svg)](https://www.zotero.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/groele/Zotero-MetaFlow?include_prereleases&color=7289da)](https://github.com/groele/Zotero-MetaFlow/releases)

[📦 下载安装包 (.xpi)](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [🚀 快速开始](#-快速开始) · [💡 核心特性](#-核心特性) · [💖 开源项目致谢](#-开源项目声明与致谢) · [📝 问题反馈](https://github.com/groele/Zotero-MetaFlow/issues)

**Zotero Flow Series**

</div>

---

> **12.1.0 更新：**摘要规范化默认纳入“检查并修复元数据”，也随新增条目自动整理执行，可在设置中关闭；清理摘要多余空白、断行和可识别的化学式片段。右下角提示由整理中原位更新为完成结果，避免重复弹出。详细变化见[发布说明](../../docs/releases/metaflow-v12.1.0.md)。

> 沿用已有偏好和本地数据格式，无需迁移设置。此前[审查台账](../../docs/commercial-readiness-2026-10-18.md)保留商业发行条件的边界。

## 📖 项目简介

**Zotero MetaFlow** 是专为 Zotero 设计的文献元数据治理与期刊指标管理插件（隶属于 Zotero Flow Series 生产力套件）。

日常科研中，从各大数据库、网页或 DOI 导入的文献元数据往往存在标题大小写混乱、作者姓名格式不一、缺失期刊缩写、无效字段冗余、缺少期刊学术评级等问题。Zotero MetaFlow 提供了 **59 项内置规则与工具**、**61 项 EasyScholar 期刊评价指标**、**Nature Index 2026 与 ESI 期刊清单本地快照**，以及**智能网络元数据自动补全**，让您的个人知识库井然有序、规范专业。

---

## ✨ 核心特性

### 1. 🧹 深度元数据清洗与规范化（59 项规则与工具）

- **标题格式规整**：支持将全大写或杂乱标题一键转换为规范的句首字母大写（Sentence case）或标题大写（Title Case），内置智能词典自动保护化学式（如 $\text{CO}_2$、$\text{H}_2\text{O}$）、基因命名、mRNA 及专有名词。
- **摘要排版规范化**：清理多余空白和段内断行，保留分段与已有行内格式，合并可识别的独立断行化学式片段。默认纳入“检查并修复元数据”和新增条目自动整理；可在“元数据规则 → 其他字段”中关闭。
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

## 🔗 多插件能力整合与科研工作流

MetaFlow 将多个 Zotero 开源插件所启发的功能整合到**统一的命令、设置和核对流程**中。这些功能经过 MetaFlow 自身的适配和实现，并不代表完整复刻各上游插件的全部功能。

| 整合能力                 | MetaFlow 目前提供的功能                                                                  | 相关开源项目                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **重复文献核对与合并**   | 重复候选检测、逐条核对、主条目选择、批量合并、重复数量统计、误报排除及非重复记录导入导出 | [Zoplicate](https://github.com/ChenglongMa/zoplicate)                          |
| **元数据身份核验**       | DOI、ISBN、PMID/PMCID、arXiv 标识符校验；可选标题检索；来源对比与字段选择性采纳          | [ZotMeta](https://github.com/RoadToDream/ZotMeta)                              |
| **DOI 与 ShortDOI 管理** | DOI 规范化、ShortDOI 解析、标识符验证，以及按需生成 ShortDOI                             | [DOI Manager](https://github.com/bwiernik/zotero-shortdoi)                     |
| **预印本与正式版管理**   | 核验 arXiv 明确关联的正式发表 DOI，选择原位更新或创建并关联正式版记录                    | [arXiv Workflow](https://github.com/AllanChain/zotero-arxiv-workflow)          |
| **语义摘要与核心论点**   | 提取 Semantic Scholar 1~2 句 TL;DR 论点摘要，回填至子笔记或 Extra 并在侧边栏展示          | [Zotero-TLDR](https://github.com/syt2/Zotero-TLDR)                             |
| **期刊缩写整理**         | 期刊全称/缩写映射、离线 ISO 4 推断、期刊与会议名称规范化                                 | [Zotero Journal Abbreviation](https://github.com/zoushucai/zotero-journalabbr) |
| **期刊评价与学术指标**   | EasyScholar 指标、分区查询、文献列表自定义列、Extra 选择性输出及期刊侧栏                 | [Update IFs / EasyScholar](https://github.com/redleafnew/zotero-updateifsE)    |

### 重复文献核对与安全合并

- **导入处理策略：**可选择保留新导入条目、保留已有条目、全部保留或始终询问。默认全部保留；自动合并另受标识符与版本一致性限制。
- **主条目选择：**支持最早添加、最新添加、最近修改、信息最完整等策略。主条目决定最终保留哪个 Zotero 条目身份。**V12.0.0 的现有文档未将“按标签优先级选择主条目”列为已实现选项。**
- **人工与批量核对：**比较候选条目的元数据，选择保留项和需要采纳的字段；将重复条目组织为互不重叠的组，按受控并发处理（1–8 组，默认 3）。
- **误报排除：**可将指定条目标记为非重复，并导入、导出此类判定记录，供人工迁移。
- **原生合并：**附件、笔记、标签和 Word 引用重定向依赖 Zotero 原生合并机制，并非简单删除其中一个条目后重新创建。
- **安全边界：**相同 DOI 不意味着任何版本都允许自动合并；出现标识符冲突或明确版本差异时，需要人工核对。暂停或停止操作会允许已经开始的合并完成提交。

### 标识符核验、元数据补全与版本管理

- **优先核对身份：**检查 DOI、ISBN、PMID/PMCID、arXiv 等标识符，若存在冲突，不直接采纳来源结果。
- **逐字段选择：**先展示候选字段、来源及差异，默认优先补齐空字段；覆盖已有信息需要明确选择。
- **可选补充检索：**缺乏标识符时，可按设置读取有限的已有 PDF 文本缓存或执行标题检索，候选仍需通过身份判定。
- **arXiv 正式版关联：**仅依据明确可核验的关联标识处理正式版，可选择更新原条目或创建关联条目；不自动替换 PDF。

### 两个核心命令

1. **检查并修复元数据：**默认运行已启用的本地完整性检查及格式整理规则，可分别开启身份核验、期刊指标和交互式去重。
2. **更新元数据：**联网核验书目信息并展示逐字段采纳结果，可按设置叠加本地规则、期刊指标及重复核对。

作者格式工具、标题替换、ShortDOI 生成、Extra 清理等需要参数或明确确认的功能仍保留在设置页对应工具区域，不会在每次检查时被隐式执行。

**延伸阅读：**[整合工作流](../../docs/integrated-workflows-2026-10-17.md) · [核心工作流审计](../../docs/core-workflow-audit-2026-10-18.md) · [期刊指标整合](../../docs/greenfrog-integration-2026-10-16.md)。

---

## 🖥️ 运行环境与兼容性

| 项目                   | 说明                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------ |
| **插件版本**           | `13.3.1`                                                                              |
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

- **[ChenglongMa/zoplicate](https://github.com/ChenglongMa/zoplicate)**、**[RoadToDream/ZotMeta](https://github.com/RoadToDream/ZotMeta)**、**[bwiernik/zotero-shortdoi](https://github.com/bwiernik/zotero-shortdoi)**、**[AllanChain/zotero-arxiv-workflow](https://github.com/AllanChain/zotero-arxiv-workflow)** 和 **[syt2/Zotero-TLDR](https://github.com/syt2/Zotero-TLDR)**：为重复文献管理、身份核验、DOI、预印本工作流及 TL;DR 论点提炼提供重要参考。MetaFlow 在自己的架构中整合相关能力，不代表与上游功能完全等价或存在官方隶属关系。

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

本项目遵循 **[GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)](../../LICENSE)** 开源协议。

- 插件所有衍生的独立修改与新增功能均保持开放。
- 第三方组件、数据集和开源项目保留其原有版权声明与许可条款。
- Zotero 是 Corporation for Digital Scholarship 的注册商标，本项目为独立第三方插件，与 Zotero 官方无从属关系。
