<div align="center">

# Zotero MetaFlow

**校验、整理并补全文献元数据，让文献库更规范。**

[English](README.md) · [简体中文](README.zh-CN.md)

![Version](https://img.shields.io/badge/version-10.0.0-blue) ![Zotero](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-green) ![License](https://img.shields.io/badge/license-AGPL-3.0-or-later-lightgrey)

[下载插件](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [问题反馈](https://github.com/groele/Zotero-MetaFlow/issues) · [版本发布](https://github.com/groele/Zotero-MetaFlow/releases)

**Zotero Flow Series**

</div>

---

## 项目概述

Zotero MetaFlow 是 Zotero Flow Series 中独立维护的插件，校验、整理并补全文献元数据，让文献库更规范。项目侧重在 Zotero 桌面环境中提供清晰、实用的科研工作流程。

## 核心功能

- 使用可配置规则整理标题、作者、DOI、日期、缩写及科学符号。
- 支持批量处理、进度反馈、取消与适用场景下的撤销/重做。
- 通过 ESI 与 Nature Index 视图查看期刊相关信息。
- 配置自定义数据来源、快捷键及自动整理选项。

## 界面展示

界面与实现细节可参考[项目文档](https://github.com/groele/Zotero-MetaFlow/tree/main/docs)（如有）。当前版本截图将在核实实际界面后添加，避免使用过期图片。

## 兼容性

| 项目         | 说明                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| 插件版本     | `10.0.0`                                                                               |
| 插件 ID      | `metaflow@groele`                                                                      |
| 声明兼容范围 | `10.0–11.*`                                                                            |
| 验证情况     | Zotero 11 的相关验证包含开发版本；清单声明的兼容范围不意味着未来所有版本均已实机验收。 |

兼容性声明不等于列出版本均已完成实机验证。

## 安装指南

1. [下载当前版本 XPI](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi)（`zotero-metaflow.xpi`）。
2. 打开 Zotero 的 **工具 → 插件**（不同版本的菜单名称可能不同）。
3. 选择 **从文件安装插件**，选中 XPI，按提示重启。

自动更新清单：[update.json](https://github.com/groele/Zotero-MetaFlow/blob/main/update.json)。

## 快速开始

1. 安装 XPI，打开 Zotero 中的 MetaFlow 插件设置。
2. 启用适合文献库的元数据规则并检查待处理条目。
3. 执行手动整理或批量任务，大规模修改前检查结果。

## 配置与注意事项

期刊索引名单仅供查询参考，不代表具体文章已被收录。进行大规模批量修改前建议备份重要文献数据。

## 开发与测试

在仓库根目录运行以下命令。涉及 Zotero 桌面实机测试时，请先配置项目要求的独立测试环境。

```powershell
pnpm install --frozen-lockfile
pnpm test:unit
pnpm lint:check
pnpm build
```

上述命令为项目提供的开发与测试入口，不表示所有系统环境或集成测试均已通过。

## 文档与支持

[Metadata workflow](docs/metadata-workflow-zh.md) · [Database guide](docs/custom-journal-databases.md) · [Compatibility](docs/zotero11-compatibility.md)

[提交问题](https://github.com/groele/Zotero-MetaFlow/issues) · [查看源码](https://github.com/groele/Zotero-MetaFlow)

## 致谢与项目来源

Zotero MetaFlow 最初基于 [northword/zotero-format-metadata](https://github.com/northword/zotero-format-metadata) 开源项目二次开发，原项目作者为 northword (Linter for Zotero)。感谢原作者及贡献者的基础工作。此 Zotero Flow Series 版本独立维护，并非上游项目或 Zotero 官方发布。原作者版权及适用的第三方声明继续有效。

## 许可证

本项目遵循 **AGPL-3.0-or-later**，具体以 [LICENSE](LICENSE) 及适用的第三方版权声明为准。

Zotero 及相关商标归各自权利人所有。
