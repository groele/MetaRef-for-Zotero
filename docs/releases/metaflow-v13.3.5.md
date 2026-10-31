# Zotero MetaFlow 13.3.5

**发布日期：** 2026-10-31  
**版本号：** 13.3.5  
**发布类型：** 补丁版本（侧边栏信息行渲染加固、多端 Fluent 本地化与简记/撷论双向联动）

---

## 🎯 核心修复与优化

### 1. 侧边栏「信息 (Info Pane)」原生行渲染健壮性加固
- **安全处理 `onItemChange` 回调参数**：
  - 针对 Zotero 7/Gecko 在条目切换时可能未向插件回调提供 `setEditable` 内部接口的情况，全面补充 `typeof setEditable === "function"` 类型保护与异常隔离（`try-catch`），彻底避免抛出未捕获的 `TypeError: setEditable is not a function` 导致该信息行渲染中断；
  - 确保即使用户在主库、回收站、分类集合或不同条目类型间高频切换，原生信息行均能安全稳定更新状态。

### 2. 多端 Fluent 本地化声明全面补齐
- **兼容 XUL 与 HTML 渲染模型**：
  - 在 `addon.ftl` 与 `main-window.ftl` 中，为 `info-row-tldr` 与 `field-tldr` 补齐 `.value` 与 `.label` 双重属性声明，确保在 Zotero XUL 宿主下 `<label value="撷论">` 与 HTML 宿主下 `textContent` 均能 100% 正常显示中英文标签，不再因属性缺失而出现空白宽度；
  - 在全局 `Zotero.ftl` 与各主窗口 `MozXULElement.insertFTLIfNeeded` 中同步注册 `metaref-addon.ftl` 与 `metaref-main-window.ftl`，确保无论后台 XPCOM 模块还是前端 DOM 上下文均能即时解析 `metaref-info-row-tldr`。

### 3. 即时加载与主窗口生命周期同步
- 在主窗口完成加载（`onMainWindowLoad`）时，自动补充调用 `registerInfoRows()` 与 `refreshTLDRInfoRow()`，确保在用户免重启热重载或首次打开主窗口时，侧边栏信息面板即时就绪并呈现「撷论」行。

### 4. 深度协同「简记」生态与默认双沉淀策略
- **默认回填模式升级为「子笔记 + Extra 字段 (双重沉淀)」(`both`)**：
  - 更新元数据回填核心论点时，默认同时写入富文本结构化子笔记与条目 Extra 附加字段（带 `remark:` 前缀）；
  - 无论用户习惯使用 MetaFlow 自带的「撷论」信息行与列，还是习惯使用 Ethereal Style / Actions & Tags 的「简记」行与列，论点均能完美同步展示与双向编辑；
- **全前缀解析增强**：
  - 支持智能识别带 `💡` 图标的各种前缀格式（如 `💡 撷论:`、`💡 TLDR:`、`💡 remark:`、`💡 简记:`），杜绝前缀格式差异导致识别遗漏。

---

## 📦 发布验证与资产

- **Version:** `13.3.5`
- **Add-on ID:** `metaflow@groele`
- **XPI File:** `zotero-metaflow.xpi`
- **File Size:** `3,502,256` 字节
- **SHA-256:** `af523d6906c076c8d7aca2d939fea622709c0746cabea39742345a8b926bd834`
- **SHA-512:** `0db1821176815a8d6d3c71e8e62b4a500efa7f6fa8131f5cc5ebdca8820c7ac1b1b686ce08e2de448c9db711cd67463f369f733daa788d18f4e8bfc336d57eba`
- **自动化测试：** 92 个单元测试套件、660 项测试全部通过（通过率 100%）。
- **静态代码检查：** ESLint 0 错误 0 警告，AutoCorrect 0 警告。
