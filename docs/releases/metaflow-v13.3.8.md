# Zotero MetaFlow 13.3.8

**发布日期：** 2026-10-31  
**版本号：** 13.3.8  
**发布类型：** 架构增强与规范补丁（Zotero 10 Web Components 深度适配、多窗口/独立阅读器支持、只读条目安全防护）

---

## 🎯 核心优化与增强

### 1. 全面拥抱 Zotero 10 Web Components 现代架构
- **Zotero 10 原生选择器对称对齐**：
  - 在 Zotero 10（Gecko 153+ 现代 Web Components 架构）下，条目面板原生依托 `<info-box>` 自定义元素与 `#info-table` 容器渲染；
  - 本次更新为「撷论（TL;DR）」字段实现了完全对称的 CSS 类名与 DOM 数据属性标注：
    - **行容器 (`.meta-row`)**：附加 `.meta-row-tldr` 与 `data-fieldname="tldr"`；
    - **标签容器 (`.meta-label`)**：附加 `.meta-label-tldr` 与 `fieldname="tldr"`；
    - **内容容器 (`.meta-data > .value`)**：附加 `.meta-value-tldr` 与 `data-fieldname="tldr"`；
  - 完美契合 Zotero 10 原生深色模式（Dark Mode）、高对比度无障碍样式及全局主题渲染规则，使自定义字段表现与原生字段毫无二致。

### 2. 多窗口与独立阅读器标签页（Detached Reader Tabs）DOM 穿透发现
- 升级 `getAllItemDocuments(doc)` 窗口遍历引擎：
  - 传统 `Zotero.getMainWindows()` 仅能覆盖主库窗口；
  - 结合 Gecko 原生 `Services.wm.getEnumerator("")` 深度枚举当前会话中所有激活窗口，精准穿透至独立拆分出的 PDF/EPUB 阅读器窗口中的 `<info-box>` 与 `#info-table` 侧边栏；
  - 无论条目在主窗口还是外置阅读器侧边栏被查看，撷论行均能瞬时、稳定呈现。

### 3. 群组库与回收站只读状态（Read-only Guard）严密防护
- 深度遵循 `item.isEditable()` 原生安全检查：
  - 在用户查看无编辑权限的只读群组库（Group Library）条目或回收站（Trash）条目时，明确禁止进入编辑态（`editable: false`）；
  - 杜绝因用户误触导致对受保护只读条目发起无效或非法的修改请求。

---

## 📦 发布验证与资产

- **Version:** `13.3.8`
- **Add-on ID:** `metaflow@groele`
- **XPI File:** `zotero-metaflow.xpi`
- **File Size:** `3,503,292` 字节
- **SHA-256:** `170d3a9ac28259ae293a89e440a2b38ab7216b1c280e24641b9ac899b825b784`
- **SHA-512:** `4ccaca8f875efe17183c269ef138eaf5b3e9e05d8ab7214a56016515f0d921f06564e29a1168c373192abfc5525b10be7ac09ab1005840066142f5955e7b27e2`
- **自动化测试：** 92 个单元测试套件、662 项测试全部通过（通过率 100%）。
- **静态代码检查：** ESLint 0 错误 0 警告，AutoCorrect 0 警告。
