# Zotero MetaFlow 12.5.2

Released: 2026-10-21

## Fixed

- Set an explicit preferences font stack shared with the Flow plugins: system-ui, Microsoft YaHei UI, Microsoft YaHei and sans-serif.
- Make setting labels, native selection controls, text fields and drop-downs explicitly inherit that font at 14px, rather than relying on host defaults.
- Preserve 14px group headings and the existing 13px descriptions and buttons; normalize button font-family inheritance.

This is a consistency fix, not a claim that the previous page used a smaller base font. The native baseline already measured 14px for the page and setting labels, and 13px for descriptions.

## Compatibility and verification

- 553 unit tests across 85 files passed. Production build and TypeScript checks passed.
- An isolated Zotero 10.0.6 profile loaded the actual installer and ViewFlow reference in the same preferences window. Eight comparison cases covered two plugins, light/dark themes and two actual widths (904px and 800px).
- MetaFlow labels, text fields, drop-downs and group headings measured 14px; descriptions measured 13px. The resulting font stack matched ViewFlow and no horizontal overflow was detected. Native screenshots were inspected.
- The profile and library were independent of the user's main Zotero configuration. This check does not revalidate Zotero 11 or all metadata, AI, network and storage workflows.
- Add-on ID, preference keys, rule behavior and the declared Zotero 10.0–11.x compatibility range remain unchanged.

## Install

Install `zotero-metaflow.xpi` from this Release using Zotero's add-on manager. Do not install the GitHub source archive. Package hashes and verification details are attached.

## 中文说明

本版明确统一 MetaFlow 设置页的字体回退与控件继承规则。正文、设置标签、输入框和下拉框为 14px，说明及按钮保留 13px。原生基线中正文原本就是 14px，本次没有把整个页面一律放大。已通过 553 项单元测试、生产构建及 Zotero 10.0.6 隔离配置下的浅深主题和两种宽度对比。
