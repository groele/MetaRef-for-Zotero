<div align="center">

# Zotero MetaFlow

**Validate, organize, and enrich your reference metadata and journal academic metrics in Zotero.**

[English](README.md) · [简体中文](README.zh-CN.md)

[![Version](https://img.shields.io/badge/version-10.6.0-blue.svg)](https://github.com/groele/Zotero-MetaFlow/releases)
[![Zotero Compatibility](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-brightgreen.svg)](https://www.zotero.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/groele/Zotero-MetaFlow?include_prereleases&color=7289da)](https://github.com/groele/Zotero-MetaFlow/releases)

[📦 Download XPI](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [🚀 Quick Start](#-quick-start) · [💡 Key Features](#-key-features) · [💖 Acknowledgements](#-open-source-projects--acknowledgements) · [📝 Issues](https://github.com/groele/Zotero-MetaFlow/issues)

**Zotero Flow Series**

</div>

---

## 📖 Overview

**Zotero MetaFlow** is a high-performance, production-grade Zotero add-on for reference metadata governance and journal academic metrics management (part of the Zotero Flow Series).

When importing items from academic databases, web pages, or DOI translators, metadata is often fraught with issues: messy title letter cases, inconsistent author name formats, missing journal abbreviations, redundant or null fields, and absence of journal tier ratings. Zotero MetaFlow provides **49 built-in metadata cleaning and linting rules**, **61 EasyScholar journal ranking and metric fields**, **official Nature Index 2026 & ESI indexed datasets**, and **intelligent online metadata enrichment**, keeping your scholarly library standardized, accurate, and professional.

---

## ✨ Key Features

### 1. 🧹 Deep Metadata Cleaning & Standardization (49 Built-in Rules)

- **Title Case Formatting**: Convert messy or all-caps titles into standard Sentence case or Title Case with one click. An intelligent dictionary preserves chemical formulas ($\text{CO}_2$, $\text{H}_2\text{O}$), gene symbols, mRNA, and proper nouns.
- **Author & Creator Normalization**: Fix inverted names, handle Pinyin transliteration and tone markers, purge invalid creators, and correct creator roles.
- **DOI Normalization & ShortDOI**: Strip redundant URL prefixes (e.g. `https://doi.org/`), validate DOI syntax, and automatically query and replace with shortDOIs via the Crossref API.
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
- **Official Nature Index 2026 Specification**: Built-in 2026 dataset (177 official statistical journals) with verified API parsing and live tracking.
- **Essential Science Indicators (ESI) Databases**: Built-in global ESI journal databases for instant discipline and top-tier indexing validation.
- **Custom Item Tree Columns & Native Sorting**: Register journal metrics (e.g. CAS Tier, CCF Grade, Nature Index) as native columns in Zotero's main item view with sorting capabilities.
- **Dedicated Journal Sidebar Pane (Journal Insights)**：Real-time panoramic view of journal metrics in the item sidebar, complete with metric badges and one-click completion actions.
- **72-Hour Persistent Cache**: Query results persist across restarts with request deduplication to save API quota and accelerate browsing.

### 4. 🌐 Intelligent Online Metadata Enrichment

- **Multi-Source Fetching**: Fetch and enrich publication data through DOI, ISBN, arXiv ID, Semantic Scholar, and translator services.
- **Flexible Update Policies**: Choose between "Blank-only" and "Overwrite" policies to safeguard user-curated records.
- **Asynchronous Live-Item Safety**: Strict pre- and post-flight verification of item identity and mutation journals to prevent cross-contamination caused by network latency or item type migrations.

### 5. 🛡️ Industrial-Grade Batch Processing & Data Safety

- **Serial Batch Queue & Configurable Concurrency**: Batch process extensive libraries safely with concurrency throttled between 1 and 16 workers.
- **Item Mutation Journal**: Fine-grained rollback of failing rules isolates errors, ensuring passing rules are cleanly applied.
- **Atomic Transactions & Fallback Recovery**: Automatically reload and restore item snapshots if a batch transaction fails, retrying items individually.
- **Comprehensive Execution Report**: Detailed before/after diff summary with one-click JSON export for audit trails.

### 6. ✍️ Rich-Text Title Toolbar

- Integrated lightweight toolbar above Zotero's title editor: quickly wrap selected text with `<i>` (italics/taxa), `<b>` (bold), `<sub>` (subscript), `<sup>` (superscript), or `<span class="nocase">` (case protection).
- Preserves native selection and cursor focus with instant live rendering preview.

---

## 🖥️ System Requirements & Compatibility

| Item                          | Details                                                                                          |
| :---------------------------- | :----------------------------------------------------------------------------------------------- |
| **Add-on Version**            | `10.6.0`                                                                                         |
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

> 💡 **Automatic Updates**: MetaFlow includes built-in auto-update support via [update.json](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/update.json).

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
   - Select one or more items in your library, right-click, and select **Zotero MetaFlow** $\rightarrow$ choose a specific tool or execute enabled standard rules.

---

## 🛠️ Development & Testing

This project is built using `pnpm` and `zotero-plugin-scaffold`:

```bash
# 1. Clone repository
git clone https://github.com/groele/Zotero-MetaFlow.git
cd Zotero-MetaFlow

# 2. Install dependencies (pnpm 12+ recommended)
pnpm install

# 3. Run unit tests (67 test suites, 429 tests)
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

Distributed under the **[GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)](LICENSE)**.

- All derivative modifications and new features remain free and open source.
- Third-party components, datasets, and icons retain their respective licenses and copyright notices.
- Zotero is a registered trademark of the Corporation for Digital Scholarship. This project is an independent third-party add-on and is not affiliated with or endorsed by Zotero.
