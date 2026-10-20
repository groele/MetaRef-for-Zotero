> 原详细指南，保存于 2026-10-21。历史版本与验证范围按原记录理解；当前安装入口见 [README](../../README.md)。

<div align="center">

# Zotero MetaFlow

**Validate, organize, and enrich your reference metadata and journal academic metrics in Zotero.**

[English](../../README.md) · [简体中文](../../README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-12.1.0-blue.svg)](https://github.com/groele/Zotero-MetaFlow/releases)
[![Zotero Compatibility](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-brightgreen.svg)](https://www.zotero.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/groele/Zotero-MetaFlow?include_prereleases&color=7289da)](https://github.com/groele/Zotero-MetaFlow/releases)

[📦 Download XPI](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [🚀 Quick Start](#-quick-start) · [💡 Key Features](#-key-features) · [💖 Acknowledgements](#-open-source-projects--acknowledgements) · [📝 Issues](https://github.com/groele/Zotero-MetaFlow/issues)

**Zotero Flow Series**

</div>

---

> **12.1.0 release:** normalize imported abstract whitespace and wrapped chemical formula fragments by default through Check and Fix Metadata. The new setting also controls automatic formatting on import. Core commands now update their running notification in place when finished. See the [release notes](../../docs/releases/metaflow-v12.1.0.md).

> Existing preferences, library metadata and local runtime formats remain compatible; no settings migration is required. The earlier [audit ledger](../../docs/commercial-readiness-2026-10-18.md) retains broader commercial-readiness limitations.

## 📖 Overview

**Zotero MetaFlow** is a Zotero add-on for reference metadata governance and journal academic metrics management (part of the Zotero Flow Series).

When importing items from academic databases, web pages, or DOI translators, metadata is often fraught with issues: messy title letter cases, inconsistent author name formats, missing journal abbreviations, redundant or null fields, and absence of journal tier ratings. Zotero MetaFlow provides **41 metadata rules and 18 tools**, **61 EasyScholar journal ranking and metric fields**, **local Nature Index 2026 and ESI journal-list snapshots**, and **intelligent online metadata enrichment**, keeping your scholarly library standardized, accurate, and professional.

---

## ✨ Key Features

### 1. 🧹 Deep Metadata Cleaning & Standardization (59 Rules and Tools)

- **Title Case Formatting**: Convert messy or all-caps titles into standard Sentence case or Title Case with one click. An intelligent dictionary preserves chemical formulas ($\text{CO}_2$, $\text{H}_2\text{O}$), gene symbols, mRNA, and proper nouns.
- **Abstract Formatting**: Clean excess whitespace and wrapped lines, preserve paragraphs and existing inline formatting, and join recognized isolated chemical formula fragments. Enabled by default in Check and Fix Metadata and automatic import; configurable under Metadata Rules → Other Fields.
- **Author & Creator Normalization**: Fix inverted names, handle Pinyin transliteration and tone markers, purge invalid creators, and correct creator roles.
- **DOI Normalization & ShortDOI**: Strip redundant URL prefixes, validate DOI syntax, and resolve shortDOIs to full DOIs while preserving the short identifier in Extra.
- **Page Range Optimization**: Normalize range delimiters to standard en-dashes (`-`) and remove redundant leading zeroes (e.g. `001-008` or `101--108` $\rightarrow$ `101-108`).
- **Date Standardization**: Format all publication dates into standard ISO 8601 (`YYYY-MM-DD`).
- **Field Misuse & Redundancy Removal**: Safely scrub `null` and `undefined` strings, strip extraneous trailing periods in titles, and correct misused fields (such as journal articles incorrectly catalogued as web pages).
- **University & Place Mapping**: Built-in global database mapping universities to their respective cities, automatically filling publication locations for theses and dissertations.

### 2. 📚 Authoritative Journal Abbreviations & ISO 4

- **JabRef Journal Abbreviation Database**: Integrated repository of standard academic journal full names and abbreviations.
- **Offline ISO 4 Inference Engine**: Infer compliant journal abbreviations offline using standard LTWA (List of Title Word Abbreviations) rules without an active internet connection.
- **Language-Adaptive Strategies**: Specialized abbreviation rules distinguishing between Chinese and English journals.

### 3. 📊 Journal Metrics & Multi-Dimensional Tier Management

- **Full EasyScholar API Integration**: Comprehensive support for **61 ranking and metric indicators**, including CAS Journal Tiers (中科院分区), CCF Recommendations, JCR Quartiles, SCI / SSCI, Excellence Action Plan (卓越行动计划), Peking University Core (北大核心), CSSCI, CSCD, and more.
- **Master Authority & Visibility Isolation**: Settings switches strictly control remote API lookups, sidebar display, Extra field writing, and custom column registration.
- **Nature Index journal membership**: Compare against the bundled 2026 snapshot of 177 journals. Membership does not prove that an individual article is counted; this is not a live tracking or official certification service.
- **Essential Science Indicators (ESI) Databases**: Built-in global ESI journal databases for local journal-discipline recognition.
- **Custom Item Tree Columns & Native Sorting**: Register journal metrics (e.g. CAS Tier, CCF Grade, Nature Index) as native columns in Zotero's main item view with sorting capabilities.
- **Dedicated Journal Sidebar Pane (Journal Insights)**：Real-time panoramic view of journal metrics in the item sidebar, complete with metric badges and one-click completion actions.
- **72-Hour Persistent Cache**: Query results persist across restarts with request deduplication to save API quota and accelerate browsing.

### 4. 🌐 Intelligent Online Metadata Enrichment

- **Multi-Source Fetching**: Fetch and enrich publication data through DOI, ISBN, arXiv ID, Semantic Scholar, and translator services.
- **Flexible Update Policies**: Choose between "Blank-only" and "Overwrite" policies to safeguard user-curated records.
- **Asynchronous Live-Item Safety**: Strict pre- and post-flight verification of item identity and mutation journals to prevent cross-contamination caused by network latency or item type migrations.

### 5. 🛡️ Batch Processing & Data Safety

- **Serial Batch Queue & Configurable Concurrency**: Batch process extensive libraries safely with concurrency throttled between 1 and 16 workers.
- **Item Mutation Journal**: Fine-grained rollback of failing rules isolates errors, ensuring passing rules are cleanly applied.
- **Atomic Transactions & Fallback Recovery**: Automatically reload and restore item snapshots if a batch transaction fails, retrying items individually.
- **Comprehensive Execution Report**: Detailed before/after diff summary with one-click JSON export for audit trails.

### 6. ✍️ Rich-Text Title Toolbar

- Integrated lightweight toolbar above Zotero's title editor: quickly wrap selected text with `<i>` (italics/taxa), `<b>` (bold), `<sub>` (subscript), `<sup>` (superscript), or `<span class="nocase">` (case protection).
- Preserves native selection and cursor focus with instant live rendering preview.

---

## 🔗 Integrated Research Workflows

MetaFlow unifies capabilities inspired by several Zotero extensions into **one coherent set of commands, preferences, and review steps**. These are integrations adapted to MetaFlow—not claims that every feature of the upstream extensions has been reproduced.

| Integrated capability                | What MetaFlow provides                                                                                                                                                                              | Relevant upstream project                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Duplicate review & merging**       | Duplicate candidate detection; item-by-item review; configurable master-item selection; bounded bulk merging; duplicate statistics; false-positive / non-duplicate records and manual import/export | [Zoplicate](https://github.com/ChenglongMa/zoplicate)                          |
| **Metadata verification**            | DOI, ISBN, PMID/PMCID and arXiv identifier checks; title-based fallback when enabled; source comparison and selective field adoption                                                                | [ZotMeta](https://github.com/RoadToDream/ZotMeta)                              |
| **DOI workflows**                    | DOI normalization, ShortDOI resolution, identifier validation, and optional ShortDOI generation                                                                                                     | [DOI Manager](https://github.com/bwiernik/zotero-shortdoi)                     |
| **Preprint-to-publication workflow** | Review of arXiv-linked published versions; either update the original record or create/link a publication record after identity verification                                                        | [arXiv Workflow](https://github.com/AllanChain/zotero-arxiv-workflow)          |
| **Journal abbreviations**            | Curated journal mappings, offline ISO 4 inference, journal/conference-name normalization                                                                                                            | [Zotero Journal Abbreviation](https://github.com/zoushucai/zotero-journalabbr) |
| **Journal rankings and metrics**     | EasyScholar metrics, journal rankings, configurable Zotero columns, selective Extra output, and journal sidebar                                                                                     | [Update IFs / EasyScholar](https://github.com/redleafnew/zotero-updateifsE)    |

### Duplicate review and citation-safe merging

- **Import decisions:** keep newly imported items, keep existing items, keep all, or ask before acting. The configured default keeps all items; import-time automatic merges are subject to strict identifier and version checks.
- **Master-item strategies:** oldest added, newest added, most recently modified, or most complete. The selected master determines which Zotero item identity is retained. **Tag-ranked master selection is not documented as an implemented V12.0.0 option.**
- **Manual and bulk review:** compare candidate metadata, choose the retained item, optionally select field values, and process disjoint duplicate groups with controlled concurrency (1–8 groups; default 3).
- **False positives:** mark two records as non-duplicates, or import/export these decisions for manual transfer.
- **Native merge semantics:** attachments, notes, tags, and citation redirection rely on Zotero's native merge mechanism; items are not merged by deleting one record and recreating another. A merge is different from a standalone deletion.
- **Safety boundary:** shared DOI alone is not sufficient to override an explicit version conflict; ambiguous or mismatched records require review. Pause/stop lets already started merges complete.

### Identifier verification and publication updates

- **Identity before adoption:** compare DOI, ISBN, PMID/PMCID or arXiv evidence with the selected item. If identifiers conflict, do not silently accept the result.
- **Review differences:** inspect candidate fields and sources; fill missing fields by default and explicitly opt in to replacing existing values.
- **Optional discovery:** when an identifier is absent, inspect a limited existing PDF text cache or perform title lookup only when enabled. A result match must still pass identity checks.
- **arXiv publication linkage:** inspect clearly linked published DOI evidence; keep the preprint and publication linked, or update the original record when explicitly selected. Automatic PDF replacement is not part of this feature.

### Two streamlined commands

1. **Check and Fix Metadata** — runs enabled local format and completeness rules. Optional identity verification, journal metrics, and interactive duplicate review can be enabled independently.
2. **Update Metadata** — checks external bibliographic evidence and lets you review proposed field changes; optional local formatting, journal metrics, and duplicate review can be included.

Specialized operations (creator styling, title replacement, ShortDOI generation, Extra cleanup and similar parameter-driven tools) remain accessible from the relevant preferences/tool sections; they are not silently run during every check.

**Further reading:** [Integrated workflow design](../../docs/integrated-workflows-2026-10-17.md) · [Core workflow audit](../../docs/core-workflow-audit-2026-10-18.md) · [Journal metric integration](../../docs/greenfrog-integration-2026-10-16.md).

---

## 🖥️ System Requirements & Compatibility

| Item                          | Details                                                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------------------- |
| **Add-on Version**            | `12.1.0`                                                                                         |
| **Add-on ID**                 | `metaflow@groele`                                                                                |
| **Supported Zotero Versions** | `Zotero 10.0 – 11.*` (Verified on Windows Zotero 10.0.6 & Zotero 11 dev Gecko 153)               |
| **Operating Systems**         | Windows / macOS / Linux                                                                          |
| **Runtime Dependencies**      | Self-contained pure ESM module running directly in Gecko (no Node.js or Python runtime required) |

---

## 📦 Installation

1. **Download Add-on**: Go to the [Releases page](https://github.com/groele/Zotero-MetaFlow/releases) or click [Download zotero-metaflow.xpi](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi).
2. **Open Zotero**: In the menu bar, navigate to **Tools** $\rightarrow$ **Plugins** (or **Add-ons**).
3. **Install from File**: Click the gear icon in the top right, select **Install Add-on From File...**, and choose the downloaded `.xpi` file.
4. **Restart Zotero**: Follow Zotero's prompt to restart the application.

> 💡 **Automatic Updates**: MetaFlow includes built-in auto-update support via [update.json](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/update.json).

---

## 🚀 Quick Start

1. **Open Preferences**: In Zotero, go to **Edit** $\rightarrow$ **Preferences** (or **Zotero** $\rightarrow$ **Preferences** on macOS) and select the **MetaFlow** tab.
2. **Configure Rules**:
   - Enable your desired metadata rules (e.g., Sentence Case, En-dash for pages, Remove Trailing Dots).
   - Optionally toggle "Auto-lint when items are added" for hands-free maintenance.
3. **Configure Journal Metrics (Optional)**:
   - Provide your EasyScholar Secret Key if you want to retrieve CAS Tiers or CCF ratings.
   - Select your preferred metrics and choose whether to register them as columns in the item tree.
4. **Run MetaFlow**:
   - Select one or more items, then use **Zotero MetaFlow: Check and Fix Metadata** or **Zotero MetaFlow: Update Metadata** from the item context menu. Configure optional stages in the core command settings; specialized tools remain available in preferences.

---

## 🛠️ Development & Testing

This project is built using `pnpm` and `zotero-plugin-scaffold`:

```bash
# 1. Clone repository
git clone https://github.com/groele/Zotero-MetaFlow.git
cd Zotero-MetaFlow

# 2. Install dependencies (pnpm 12+ recommended)
pnpm install

# 3. Run unit tests
pnpm test:unit

# 4. Code quality & lint checks
pnpm lint:check

# 5. Build production bundle (output to .scaffold/build/)
pnpm build
```

---

## 💖 Open Source Projects & Acknowledgements

Zotero MetaFlow stands on the shoulders of giants in the open source community. We express our deepest gratitude and recognition to the following open-source projects and their creators:

### Foundational Open Source Projects

- **[northword/zotero-format-metadata](https://github.com/northword/zotero-format-metadata)** (Linter for Zotero):
  Originally developed and branched from `zotero-format-metadata` by northword. Its rule architecture and batch execution engine laid the cornerstone for this project. We sincerely thank northword and all upstream contributors for their pioneering efforts.
- **[zoushucai/zotero-journalabbr](https://github.com/zoushucai/zotero-journalabbr)**:
  Special thanks to zoushucai for the inspiring `zotero-journalabbr` project! Its innovative approach to journal abbreviation normalization, mapping dictionaries, and Zotero integration offered invaluable references for our journal abbreviation subsystem.
- **[redleafnew/zotero-updateifsE](https://github.com/redleafnew/zotero-updateifsE)**:
  Special thanks to redleafnew for the outstanding `zotero-updateifsE` project! Its trailblazing work in leveraging the EasyScholar API to fetch CAS journal tiers, impact factors, and writing metrics back to Zotero's Extra field provided foundational insights for MetaFlow's 61-metric integration, master preference control, and item column architecture.

- **[ChenglongMa/zoplicate](https://github.com/ChenglongMa/zoplicate)**, **[RoadToDream/ZotMeta](https://github.com/RoadToDream/ZotMeta)**, **[bwiernik/zotero-shortdoi](https://github.com/bwiernik/zotero-shortdoi)** and **[AllanChain/zotero-arxiv-workflow](https://github.com/AllanChain/zotero-arxiv-workflow)**: Important reference projects for duplicate-management, identity validation, DOI, and preprint workflows. MetaFlow adapts the relevant ideas within its own architecture; this does not imply complete feature equivalence or official affiliation.

### Plugin Tooling & Infrastructure

- **[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)**: Outstanding modern Zotero plugin template and workflow by windingwind.
- **[northword/zotero-plugin-scaffold](https://github.com/northword/zotero-plugin-scaffold)**: Professional build and scaffolding toolchain for Zotero extensions.
- **[windingwind/zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)**: Comprehensive runtime API toolkit and abstraction layer for Zotero.

### Curated Datasets & Web Services

- **[JabRef / abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org)**: High quality, curated worldwide academic journal title abbreviation dataset.
- **[EasyScholar](https://www.easyscholar.cc/)**：Open academic journal evaluation, ranking, and indexing service.
- **[Nature Index](https://www.nature.com/nature-index/)**：Authoritative science research output database by Springer Nature.

### Core Open Source Libraries

- **[es-toolkit](https://github.com/toss/es-toolkit)**: Modern, ultra-fast JavaScript utility library.
- **[tinyld](https://github.com/mayankdugar/tinyld)**: Lightweight, pure JavaScript language detector.
- **[tiny-pinyin](https://github.com/creeperyang/pinyin)**: Fast Chinese Pinyin conversion library.
- **[p-throttle](https://github.com/sindresorhus/p-throttle)**: Reliable promise rate limiter by Sindre Sorhus.
- **[csvtojson](https://github.com/Keyang/node-csvtojson)**: Fast CSV dataset parser.
- **[quote-quote](https://github.com/unindented/quote-quote)**: String quotation normalization library.
- **[esbuild](https://github.com/evanw/esbuild)** / **[vitest](https://github.com/vitest-dev/vitest)** / **[eslint](https://github.com/eslint/eslint)** / **[autocorrect](https://github.com/huacnlee/autocorrect)**: Modern engineering foundation ensuring blazing fast bundling, testing, linting, and formatting.

---

## 📄 License

Distributed under the **[GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)](../../LICENSE)**.

- All derivative modifications and new features remain free and open source.
- Third-party components, datasets, and icons retain their respective licenses and copyright notices.
- Zotero is a registered trademark of the Corporation for Digital Scholarship. This project is an independent third-party add-on and is not affiliated with or endorsed by Zotero.

### Workflow and data design

Version 12.1.0 combines automatic metadata decisions, complete-command scheduling and feedback, and a bounded local runtime history file. See [workflow and data layout](../../docs/global-workflow-and-data-layout.md) and [automatic metadata and cache policy](../../docs/automatic-metadata-and-runtime-cache.md) for settings, data retention and verification limits.
