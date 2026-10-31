# Zotero MetaFlow 13.4.0

**发布日期：** 2026-10-31  
**版本号：** 13.4.0  
**发布类型：** 功能增强版本（深度整合 ZotAssets：文献正文与补充材料 (SI) 角色解耦与规范命名）

---

## 🎯 核心优化与新功能

### 1. 深度整合 ZotAssets：正文与补充材料（SI）角色解耦与规范命名
针对 Nature、Science、Cell 等顶级期刊中大量核心实验方法、生信数据、附图附表分散在独立 Supplementary Information（SI）文件中的学术管理痛点，正式引入 ZotAssets（Lyz-623/ZotAssets）的核心能力：
- **双层保守智能识别引擎**：
  - **文件名特征层**：精准识别 `supp`, `supplement`, `supplementary`, `suppinfo`, `supporting information`, `esi`, `esm`, `moesm`, `si`, `sm`, `补充材料`, `支持信息` 等国内外主流学术出版商的 SI 标识；
  - **文本与图表特征层**：结合 Zotero PDF 引擎扫描前序页面，智能捕获 `Supplementary Information`, `Supporting Information`, `Figure S1`, `Table S1` 等补充材料专属标题与图表标注；对正文则综合匹配条目 DOI、期刊名、标题及收稿/摘要元数据；
- **跨平台安全命名规范（Safe Renaming）**：
  - 自动套用 `{author}_{year}_{title}_{role}.pdf` 模板，正文生成 `..._Main.pdf`，补充材料生成 `..._Supplement.pdf`（多附件自动递增 `..._Supplement__2.pdf`）；
  - 全面实行跨平台文件系统无害化：剔除 `< > : " / \ | ? *` 与控制字符，规避 Windows 设备保留名（`CON`, `PRN`, `AUX`, `NUL` 等），控制叶文件名字节预算在 240 字节以内，杜绝因超长或非法路径损坏文件；
- **条目树状标题同步（Visual Role Tagging）**：
  - 自动将 Zotero 附件条目标题规范化标注为 `[正文] 论文标题` 与 `[补充材料] 论文标题`，在文献列表中一目了然，无需反复点开预览即可辨识主次附件；
  - 具备幂等性防护，多次执行不会重复堆叠标签。

### 2. 纳入标准「检查并修复元数据」工作流与独立开关控制
- **标准规则体系无缝纳管**：作为标准规则 `correct-attachment-roles` 注册至元数据清洗管线中，用户执行批量元数据检查与治理时自动按需运行；
- **设置页完全自主掌控**：
  - 在 Zotero 设置 -> MetaFlow 首选项「条目」卡片中增设专门选项区；
  - 遵循用户指令，**主开关默认关闭**，由用户完全自主决定是否开启；
  - 提供「自动规范重命名 PDF 文件」与「同步更新附件条目标题」两项独立细分控制开关。

---

## 📦 发布验证与资产

- **Version:** `13.4.0`
- **Add-on ID:** `metaflow@groele`
- **XPI File:** `zotero-metaflow.xpi`
- **File Size:** `3,507,341` 字节
- **SHA-256:** `e38f841965db8f7bd0f177d0227fca657de9166267ca148f54ab0c4392218579`
- **SHA-512:** `95df5fe22caa9ca52adb33c220f86beb816232dd42fde008c988e4ccffedf8e8d13ec542d55ef23ee6532a11e34abf6a5baef8dd3af0acc6f1e6b33b46c4516d`
- **自动化测试：** 93 个单元测试套件、674 项测试全部通过（通过率 100%）。
- **静态代码检查：** ESLint 0 错误 0 警告，AutoCorrect 0 警告。
