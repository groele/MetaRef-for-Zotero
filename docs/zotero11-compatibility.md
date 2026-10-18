# Zotero 11 / Firefox 153 迁移审查

日期：2026-10-14。版本：10.0.0。

依据：项目根目录的《Zotero11-Firefox153-插件适配指南》以及 [Zotero 11 官方开发文档](https://www.zotero.org/support/dev/zotero_11_for_developers)。按用户要求，安装清单和更新清单的兼容上限改为 `strict_max_version: 11.*`，最低版本保留 `10.0`。Firefox 140 构建目标继续保留，使同一脚本可在 Gecko 140 和 153 中运行。Zotero 11 的验证基于开发版，不代表未来所有构建均已验证。

插件显示名称更新为 `Zotero MetaFlow`，ID 更新为 `metaflow@groele`，主页与更新路径统一到 `groele/Zotero-MetaFlow`。内部资源、实例及设置前缀保持原值，以继续使用 MetaRef 设置。更换 ID 需要手动安装一次并移除旧插件。

## 实际修改

- 删除设置片段中的内联 `onload`，注册独立的 `content/scripts/preferences.js`，明确 `defaultXUL: true`。
- 通过文档捕获阶段接收非冒泡的片段 `load`，过滤本插件根节点，兼顾脚本加载前片段已经存在的情况；重复脚本加载和根节点初始化有独立去重。
- 设置控件使用所属窗口创建的 AbortController，关闭窗口和插件禁用时释放事件、文档监听及窗口引用。
- 宿主初始化和数据库加载等待结束后检查插件存活状态，防止禁用后的延迟注册；启动失败会清理已注册资源。
- 独立清理 Notifier、设置页、对话框、批处理、菜单、栏目、侧栏、主窗口事件和 Fluent。菜单、栏目及侧栏内部的多个注销操作也分别隔离错误。同步注销接口继续同步完成。
- 侧栏刷新在 Promise 链中执行，同时捕获同步异常和异步拒绝。
- 在端到端测试中增加可选平台断言：`METAREF_TEST_PLATFORM=153` 或 `140`，避免只根据安装目录推断宿主。

## 审计结果

现有代码使用反射布尔属性（`hidden`、`disabled`、`checked`），CSS 使用 `[hidden]`。未发现写入 `hidden="false"` 等错误链路。设置页 checkbox 已使用 `command`；菜单通过 Zotero.MenuManager 注册；没有需要替换的同步密码接口、懒加载服务字符串接口、remote browser 或 wizard。

项目未修改内建对象；新增冻结内建对象条件下的 bootstrap 和设置脚本回归。插件实际使用的 toolkit 模块没有 `ownerGlobal` 调用；依赖的 Guide 模块仍有这种调用，但项目没有导入或使用 Guide，未修改依赖文件。

搜索框改用 `type="text"` 和 `role="searchbox"`，保留搜索语义以及现有带本地化标签的清空按钮，避免 Firefox 153 为 search 输入框附加第二个清除控件。开发版中无法通过 computed style 或 CSSOM 验证内部清除伪元素，最终方案不依赖该伪元素。

## 验证边界

最终 V10（10.0.0）安装包：257 项单元测试通过；Windows Zotero 10.0.6 / Gecko 140 英文界面专项回归 8 项、Zotero 11.0-dev.5+dac1ad489 / Gecko 153 中文界面专项回归 8 项均通过，使用同一交付 XPI。版本号及显示名称调整前的完整实机回归为两套平台各 50 项（12.2.1）；V10 本轮仅重跑设置页、平台断言和生产包安装专项。生产构建、插件与测试 TypeScript、ESLint、AutoCorrect 均通过。XPI 清单、更新清单、外部设置脚本及 SHA-256 已核对；生产脚本没有残留 ownerGlobal 或 CheckboxStateChange。

自动回归覆盖设置片段事件时序、监听释放、初始化期间禁用、数据库加载期间禁用、启动失败清理、注销异常隔离和冻结内建对象。真实端到端回归使用 scaffold 创建的 `.scaffold/test/profile` 和 `.scaffold/test/data`，每次重建独立测试环境，不打开日常数据库。

实机测试包含原生菜单、标题选区格式、快捷键、设置搜索和依赖开关、文件校验、期刊侧栏、字段保存、事务回滚、撤销和重做、生命周期清理，以及最终生产 XPI 的临时安装与数据读取。

最终计数与包校验记录见 `dist/verification.json`。本次不包含持久安装后的重启验收、人工视觉验收、外部元数据服务可用性、macOS/Linux 或全部第三方插件组合；不能据此宣称全面兼容所有 Zotero 11 构建。

## 2026-10-18 本地候选版选择接口补充

10.7.0-beta.4 的去重设置按钮实测发现：Zotero 11 的 `getSelectedLibraryID()` 和 `getSelectedCollection()` 已是抛出移除错误的兼容桩，不能仅按方法存在与否继续调用。统一适配优先使用 `getSelectedLibraryIDs()` / `getSelectedCollections()`，仅在复数接口不存在的旧宿主回退。批量去重遇到多文库选择会明确拒绝模糊范围，旧集合命令按复数集合取得条目并去重。

两宿主的去重、选择兼容及生产安装定向测试各 17 项通过；新适配增加五项纯逻辑测试。完整本轮范围与分批证据见 `systematic-acceptance-2026-10-18.md`。这些结果不替代原插件共存测试。
