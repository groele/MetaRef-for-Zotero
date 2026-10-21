# Zotero MetaFlow

> 当前插件版本为 12.5.1，字号与强调色按 Zotero Flow 品牌规范统一。

**Zotero Flow Series · 元数据整理**

_让研究的每一步衔接起来。 / Connect each step of research._

校验、规范并补全文献元数据。

[简体中文](README.md) · [English](README.en.md)

[![当前版本](https://img.shields.io/badge/version-12.5.1-245ac7?style=flat-square)](https://github.com/groele/Zotero-MetaFlow/releases/tag/v12.5.1) · [下载 XPI](https://github.com/groele/Zotero-MetaFlow/releases/download/v12.5.1/zotero-metaflow.xpi) · [问题反馈](https://github.com/groele/Zotero-MetaFlow/issues)

[产品定位](#overview) · [安装与更新](#installation) · [快速开始](#quick-start) · [核心功能](#features) · [设置与使用](#settings) · [数据、同步与外部服务](#data) · [兼容性与验证范围](#compatibility) · [常见问题](#troubleshooting) · [开发与详细文档](#development) · [系列产品](#series) · [项目来源与许可](#license)

<a id="overview"></a>

## 产品定位

面向需要批量维护文献库的研究者，将字段规范、期刊缩写、在线补全和期刊指标整合到可配置的规则与工具中。

本插件可以独立安装，按需与系列其他插件组合使用。

<a id="installation"></a>

## 安装与更新

1. 下载 [zotero-metaflow.xpi](https://github.com/groele/Zotero-MetaFlow/releases/download/v12.5.1/zotero-metaflow.xpi)（插件版本 **12.5.1**），不要安装 Source code ZIP。
2. 在 Zotero 打开 **工具 → 插件／附加组件**，从齿轮菜单选择 **从文件安装插件**。
3. 选择 XPI，完成安装；按提示重启 Zotero。

后续可在插件管理器中检查更新。自动检查／安装取决于 Zotero 与该插件的更新设置和兼容范围。升级或迁移前备份重要数据。

更新清单：[dist/update.json](https://github.com/groele/Zotero-MetaFlow/blob/main/dist/update.json) · 插件 ID: `metaflow@groele`.

<a id="quick-start"></a>

## 快速开始

1. 先选少量文献，在设置中选择需要的规则。
2. 从条目右键菜单运行“检查并修复元数据”或“更新元数据”。
3. 检查结果报告，再对更多条目执行；在线指标按需配置。

<a id="features"></a>

## 核心功能

| 功能     | 使用范围                                                           |
| -------- | ------------------------------------------------------------------ |
| 字段规范 | 整理标题、作者、摘要、日期、页码与 DOI；按需要选择规则。           |
| 期刊信息 | 使用期刊缩写数据与本地期刊名单；EasyScholar 在线指标需要配置密钥。 |
| 在线补全 | 根据条目标识与来源核验结果补全元数据，并配置填空或覆盖策略。       |
| 批量报告 | 查看执行结果、变更与错误；重复项和预印本流程保留人工复核环节。     |

<a id="settings"></a>

## 设置与使用

在 **Zotero → 设置 → Zotero MetaFlow** 中查看插件偏好页。

规则开关、自动导入整理、补全策略、期刊指标与显示位置分别配置。先在少量条目上确认结果，再批量处理。

<a id="data"></a>

## 数据、同步与外部服务

- 规则可能写入 Zotero 条目字段；期刊指标的侧栏显示与写入 Extra 分别受设置控制。
- 在线补全与指标查询会联系相应外部服务；离线名单是随包快照，不能代表实时收录或文章认证。

<a id="compatibility"></a>

## 兼容性与验证范围

| 项目                   | 范围                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| 当前插件版本           | 12.5.1                                                                               |
| 清单声明的 Zotero 范围 | `10.0` 至 `11.*`                                                                     |
| 当前说明               | 本轮未重新运行 MetaFlow 的业务流程或原生回归；历史验证记录位于原有指南和审查文档中。 |

插件版本与 Zotero 版本分别管理。清单允许安装，不代表所有版本、操作系统和外部服务均已验证。本次品牌文档更新未重新执行业务功能测试。

<a id="troubleshooting"></a>

## 常见问题

指标未显示时，检查密钥、查询开关、显示开关和来源返回结果。对有疑问的元数据或重复候选先复核，勿仅凭标题自动认定同一文献。

反馈时提供插件与 Zotero 版本、系统、操作步骤、预期／实际结果和脱敏错误。

<a id="development"></a>

## 开发与详细文档

普通安装无需开发环境。以下为仓库已有开发入口，涉及原生测试时使用独立配置。

```powershell
pnpm install
pnpm test:unit
pnpm lint:check
pnpm build
```

- [工作流与数据设计 / Workflow and data](docs/global-workflow-and-data-layout.md)
- [自动整理与缓存 / Automation and cache](docs/automatic-metadata-and-runtime-cache.md)
- [版本说明 / Release notes](docs/releases/metaflow-v12.5.1.md)
- [产品简介 / Product profile](docs/brand/PRODUCT.md)
- [品牌规范 / Brand guide](docs/brand/BRAND.md)
- [README 模板 / README template](docs/brand/README-TEMPLATE.md)
- [后续提升清单 / Improvement priorities](docs/brand/IMPROVEMENTS.md)
- [原详细指南 · README.md](docs/reference/README.md)
- [原详细指南 · README.zh-CN.md](docs/reference/README.zh-CN.md)

原详细指南保留功能细节、快捷键、历史验证与完整致谢；其中版本和测试结果属于各自记录时间。

<a id="series"></a>

## 系列产品

| 产品                                                           | 定位                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| [Zotero RefFlow](https://github.com/groele/Zotero-RefFlow)     | 文献发现 · 检索参考文献、被引文献与相关研究。           |
| [Zotero MetaFlow](https://github.com/groele/Zotero-MetaFlow)   | 元数据整理 · 校验、规范并补全文献元数据。               |
| [Zotero ViewFlow](https://github.com/groele/Zotero-ViewFlow)   | 阅读预览 · 在 Zotero 侧栏预览并复制格式化引文。         |
| [Zotero MindFlow](https://github.com/groele/Zotero-MindFlow)   | 知识组织 · 将文献、批注与思路组织为可编辑导图。         |
| [Zotero TaskFlow](https://github.com/groele/Zotero-TaskFlow)   | 任务推进 · 将文献研读转化为可追踪的任务与计划。         |
| [Zotero CiteFlow](https://github.com/groele/Zotero-CiteFlow)   | 写作引用 · 追踪 Word 文档引用，并连接 Zotero 文献操作。 |
| [Zotero PaperFlow](https://github.com/groele/Zotero-PaperFlow) | 投稿审稿 · 管理手稿、投稿轮次与审稿回复。               |

各插件分别安装和更新；同属一个系列不意味着共享数据库或已自动联通所有流程。

<a id="license"></a>

## 项目来源与许可

基于 northword 的 zotero-format-metadata，并使用 Zotero 插件工具链。其他参考项目、数据集、服务与作者致谢完整保留在详细指南中。

许可：[AGPL-3.0-or-later](LICENSE).

本系列独立维护，并非 Zotero 官方产品。Zotero 及第三方名称、商标与材料归各自权利人所有。
