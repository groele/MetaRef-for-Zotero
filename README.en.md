> Current maintained version: **12.6.10**. The journal pane groups content under “Evaluation & metrics” and “Disciplines & indexing”, and shows the journal ISSN when ISSN is the match basis. [Release notes](docs/releases/metaflow-v12.6.10.md).

# Zotero MetaFlow

> Current version 12.6.10 groups journal-pane content into two sections and displays the journal ISSN when it is the match basis. [Release notes](docs/releases/metaflow-v12.6.10.md).

**Zotero Flow Series · Metadata**

_让研究的每一步衔接起来。 / Connect each step of research._

Validate, normalize, and enrich reference metadata.

[简体中文](README.md) · [English](README.en.md)

[![Release](https://img.shields.io/badge/version-12.6.10-245ac7?style=flat-square)](https://github.com/groele/Zotero-MetaFlow/releases/tag/v12.6.10) · [Download XPI](https://github.com/groele/Zotero-MetaFlow/releases/download/v12.6.10/zotero-metaflow.xpi) · [Report an issue](https://github.com/groele/Zotero-MetaFlow/issues)

[Overview](#overview) · [Installation and updates](#installation) · [Quick start](#quick-start) · [Key features](#features) · [Settings](#settings) · [Data, sync, and services](#data) · [Compatibility and validation](#compatibility) · [Troubleshooting](#troubleshooting) · [Development and documentation](#development) · [The Flow series](#series) · [Origin and license](#license)

<a id="overview"></a>

## Overview

For researchers maintaining a literature library: configure metadata rules, journal abbreviations, online enrichment, and journal metrics in one add-on.

Install this add-on independently and combine it with other Flow products as needed.

<a id="installation"></a>

## Installation and updates

1. Download [zotero-metaflow.xpi](https://github.com/groele/Zotero-MetaFlow/releases/download/v12.6.10/zotero-metaflow.xpi) (add-on version **12.6.10**), not the Source code ZIP.
2. In Zotero, open **Tools → Plugins/Add-ons**, then choose **Install Add-on From File** from the gear menu.
3. Select the XPI, complete installation, and restart if requested.

Use the add-on manager to check for later updates. Automatic checking/installation depends on Zotero, per-add-on update settings, and compatibility. Back up important data before upgrades or migration.

Update feed: [dist/update.json](https://github.com/groele/Zotero-MetaFlow/blob/main/dist/update.json) · Add-on ID: `metaflow@groele`.

<a id="quick-start"></a>

## Quick start

1. Select a small set of items and choose the rules you need in settings.
2. Run Check and Fix Metadata or Update Metadata from the item context menu.
3. Review the result report before processing more items; configure online metrics as needed.

<a id="features"></a>

## Key features

| Differentiator                              | What it does                                                                                                                                                  | Boundary                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Composable metadata rules                   | Applies selected rules to title casing, creators, abstract whitespace, dates, pages, DOIs, and common field misuse.                                           | Rules change Zotero item fields; technical terms, chemical formulae, author identity, and exceptional results still merit review. |
| Journal abbreviations and local recognition | Uses bundled abbreviation data and offline ISO 4 inference to help normalize journal names, with local ESI/Nature Index snapshots.                            | Bundled lists are versioned snapshots—not live databases or certification of a journal or individual paper.                       |
| Multi-dimensional journal indicators        | Presents configured EasyScholar metrics, tiers, and indexing information in side-pane/list contexts, with separate controls for lookup, display, and writing. | Online metrics require user-configured credentials; service responses, caching, and field meaning remain source-dependent.        |
| Identity-first online enrichment            | Enriches from DOI, ISBN, arXiv, and available services with blank-only and explicit overwrite policies.                                                       | Title similarity alone never establishes identity; source conflicts and overwriting curated fields require human judgment.        |
| Batch queue, rollback, and report           | Uses bounded concurrency plus transactional/snapshot recovery for batch rules, reporting changes and errors for audit.                                        | This contains single-item failures but does not replace backup or human review of duplicates and preprints.                       |
| Rich-text title helper                      | Adds italics, bold, subscript, superscript, and no-case protection in Zotero’s title editor while preserving native selection/cursor behavior.                | It assists title editing; it does not substitute for journal-specific style review.                                               |

<a id="settings"></a>

## Settings

Open the add-on preference page in **Zotero → Settings → Zotero MetaFlow**.

Configure rules, formatting on import, enrichment policy, journal metrics, and display separately. Review a small sample before batch processing.

Version 12.6.1 adds “Merge all duplicates in this library” to Zotero's native Duplicate Items pane. Confirm once to process all native duplicate groups, with cancellation and a result summary. It follows MetaFlow's master strategy (oldest by default), fills empty fields, and retains the master's conflicting values. Groups with different types, non-duplicate decisions, or intervening edits are skipped. Zotero's native merge maintains attachments, notes, tags, collections, relations, and Undo.

Version 12.6.1 restores native bottom-right notifications for batch confirmation, progress and results, removing the panel below the item list.

<a id="data"></a>

## Data, sync, and services

- Rules can write Zotero item fields; journal-metric display and Extra writes have separate settings.
- Enrichment and metric queries contact their respective services. Bundled lists are snapshots, not live coverage or article certification.

<a id="compatibility"></a>

## Compatibility and validation

| Item                   | Scope                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current add-on version | 12.6.10                                                                                                                                                   |
| Declared Zotero range  | `10.0` through `11.*`                                                                                                                                     |
| Evidence boundary      | See the [release notes](docs/releases/metaflow-v12.6.10.md) for validation and compatibility boundaries. No automatic installation into the main profile. |

Add-on and Zotero versions are separate. Declared compatibility does not establish testing on every host, operating system or service. This patch validates the targeted behaviors listed above, not all plugin workflows or main-profile installation.

<a id="troubleshooting"></a>

## Troubleshooting

If metrics are missing, check credentials, query/display switches, and service results. Review uncertain metadata and duplicate candidates rather than relying on titles alone.

For an issue, include add-on/Zotero versions, OS, steps, expected/actual results, and sanitized errors.

<a id="development"></a>

## Development and documentation

Normal installation needs no development environment. Existing developer entry points follow; use an isolated profile for native tests.

```powershell
pnpm install
pnpm test:unit
pnpm lint:check
pnpm build
```

- [工作流与数据设计 / Workflow and data](docs/global-workflow-and-data-layout.md)
- [自动整理与缓存 / Automation and cache](docs/automatic-metadata-and-runtime-cache.md)
- [版本说明 / Release notes](docs/releases/metaflow-v12.6.1.md)
- [产品简介 / Product profile](docs/brand/PRODUCT.md)
- [品牌规范 / Brand guide](docs/brand/BRAND.md)
- [README 模板 / README template](docs/brand/README-TEMPLATE.md)
- [后续提升清单 / Improvement priorities](docs/brand/IMPROVEMENTS.md)
- [Previous detailed guide · README.md](docs/reference/README.md)
- [Previous detailed guide · README.zh-CN.md](docs/reference/README.zh-CN.md)

Previous detailed guides retain feature detail, shortcuts, historical evidence, and full attribution. Their versions and test results belong to the recorded stage.

<a id="series"></a>

## The Flow series

| Product                                                        | Role                                                                       |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Zotero RefFlow](https://github.com/groele/Zotero-RefFlow)     | Discovery · Discover references, citing works, and related research.       |
| [Zotero MetaFlow](https://github.com/groele/Zotero-MetaFlow)   | Metadata · Validate, normalize, and enrich reference metadata.             |
| [Zotero ViewFlow](https://github.com/groele/Zotero-ViewFlow)   | Preview · Preview and copy formatted references in Zotero’s item pane.     |
| [Zotero MindFlow](https://github.com/groele/Zotero-MindFlow)   | Knowledge · Organize papers, annotations, and ideas into editable maps.    |
| [Zotero TaskFlow](https://github.com/groele/Zotero-TaskFlow)   | Tasks · Turn literature reading into trackable tasks and plans.            |
| [Zotero CiteFlow](https://github.com/groele/Zotero-CiteFlow)   | Citation · Track Word citations and connect them to Zotero items.          |
| [Zotero PaperFlow](https://github.com/groele/Zotero-PaperFlow) | Publication · Manage manuscripts, submission rounds, and review responses. |

Each add-on installs and updates separately. A shared brand does not imply a shared database or automatic integration of every workflow.

<a id="license"></a>

## Origin and license

**Derivative notice:** Zotero MetaFlow is derived from northword’s open-source [zotero-format-metadata](https://github.com/northword/zotero-format-metadata) and is built with the `zotero-plugin-template` and `zotero-plugin-scaffold` toolchain. Attribution for the upstream rule/batch architecture and acknowledgements for other projects, datasets, services, and authors remain in the detailed guides; this is independently maintained and not an official Zotero release.

License: [AGPL-3.0-or-later](LICENSE).

This series is independently maintained and is not an official Zotero product. Zotero and third-party names, trademarks, and materials belong to their respective rights holders.

[Release/tag policy](docs/release-tag-policy.md)
