# Zotero MetaFlow 13.3.7

**发布日期：** 2026-10-31  
**版本号：** 13.3.7  
**发布类型：** 补丁版本（侧边栏原生锚点深度适配、快照复活早期出版物识别与生命周期响应加固）

---

## 🎯 核心优化与增强

### 1. 侧边栏「信息」面板「撷论」行与原生标准字段类名规范深度对齐
- **原生选择器兼容强化**：
  - 在 `placeTLDRBeforeExtra` 中，自动为「撷论」行的容器与标签赋予标准规范标识：
    - 行容器附加 `.meta-row-tldr` 与 `data-fieldname="tldr"`；
    - 标签容器附加 `.meta-label-tldr` 与 `fieldname="tldr"`；
  - 完美契合 Zotero 7 原生字段选择器约定，方便深色模式、无障碍高对比度及个性化主题样式无缝应用与继承。
- **动态锚点兜底保障**：
  - 优先精准锚定于「其他 (`extra`)」行正上方；若遇到部分特殊条目类型或未渲染 `extra` 字段的情况，自动智能平滑回退至「添加日期 (`dateAdded`)」正上方，确保 100% 稳定位于常规元数据之后、系统时间戳之前。
- **全表 DOM 观察器主动防护**：
  - 不仅监听已有 `tldrRow` 的父节点，还对当前窗口内的 `#info-table` 实行主动观察，确保在任何快速切库、切标签或异步重建场景下均能在同帧内自愈就位。

### 2. 剪藏快照复活（Web Snapshot Reviver）学术识别扩展
- **支持首发与在线优先（Early-View / Online-First）文献**：
  - 针对 Nature、Science、PNAS 等顶级刊物的新刊论文往往在初期未分配卷期或页码（但已具备权威 `publicationTitle` 与 `DOI`）的实际痛点，放宽期刊识别条件，优先将具备 DOI 与刊名的快照直接复活为正式 `journalArticle`，杜绝其被误判保留为残缺网页；
- **全面适配 `ar5iv.org` 与学术实验室镜像**：
  - 在 URL 识别层全面支持 `ar5iv.labs.arxiv.org` 与 `ar5iv.org` HTML 论文剪藏链接，自动精准解析预印本编号并升级为正规 `preprint`。

### 3. 数据变更通知与侧边栏即时响应
- 在全局 `Zotero.Notifier` 的 `modify` 事件回调中接入 `refreshTLDRInfoRow()`，当用户直接在下方「其他」字段中键入 `remark:` 或通过外部同步更新元数据时，右侧「撷论」行即时同步刷新，无需用户手动切条目或重载窗口。

---

## 📦 发布验证与资产

- **Version:** `13.3.7`
- **Add-on ID:** `metaflow@groele`
- **XPI File:** `zotero-metaflow.xpi`
- **File Size:** `3,503,038` 字节
- **SHA-256:** `241a186940ca627db7b23ff4812980815cd41e4b95438eb9080e0a56af3c77d5`
- **SHA-512:** `e74c3004cd175ec8690079af93fd855c92185a08d5db13359823608e7c038b4d89e2d03370caa3e945a0630bf328bfb09a221d9c73398d7b4fd57c39f0dbe67c`
- **自动化测试：** 92 个单元测试套件、662 项测试全部通过（通过率 100%）。
- **静态代码检查：** ESLint 0 错误 0 警告，AutoCorrect 0 警告。
