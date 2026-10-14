<div align="center">

# Zotero MetaFlow

**Validate, organize, and enrich your reference metadata.**

[English](README.md) · [简体中文](README.zh-CN.md)

![Version](https://img.shields.io/badge/version-10.0.0-blue) ![Zotero](https://img.shields.io/badge/Zotero-10.0%E2%80%9311.*-green) ![License](https://img.shields.io/badge/license-AGPL-3.0-or-later-lightgrey)

[Download](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) · [Report an Issue](https://github.com/groele/Zotero-MetaFlow/issues) · [Releases](https://github.com/groele/Zotero-MetaFlow/releases)

**Zotero Flow Series**

</div>

---

## Overview

Zotero MetaFlow is an independently maintained Zotero add-on that validate, organize, and enrich your reference metadata. It is designed for research workflows that need practical functionality within the Zotero desktop application.

## Key Features

- Apply configurable metadata rules for titles, authors, DOI, dates, abbreviations, and scientific notation.
- Use batch processing with progress reporting, cancellation and undo/redo where supported.
- Inspect journal information through ESI and Nature Index views.
- Customize data sources, keyboard shortcuts, and automatic cleanup settings.

## Screenshots

For interface examples and implementation details, see the [project documentation](https://github.com/groele/Zotero-MetaFlow/tree/main/docs) where available. Screenshots will be added only after they are verified against the current interface.

## Compatibility

| Item | Details |
| --- | --- |
| Add-on version | `10.0.0` |
| Add-on ID | `metaflow@groele` |
| Declared Zotero range | `10.0–11.*` |
| Verification | Zotero 11 checks include development builds; support declared by the manifest does not imply validation against every future release. |

The declared compatibility range is not a guarantee that every Zotero version has been tested.

## Installation

1. [Download the XPI](https://raw.githubusercontent.com/groele/Zotero-MetaFlow/main/dist/zotero-metaflow.xpi) for the current release (`zotero-metaflow.xpi`).
2. Open Zotero → **Tools → Plugins** (or the add-on manager in your version).
3. Choose **Install Add-on From File**, select the XPI, and restart Zotero if requested.

Update feed: [update.json](https://github.com/groele/Zotero-MetaFlow/blob/main/update.json).

## Quick Start

1. Install the XPI and open MetaFlow preferences in Zotero.
2. Enable the metadata rules that fit your library and review the target items.
3. Run selected cleanup tools or a batch operation; inspect results before large-scale updates.

## Configuration & Notes

Index lists are reference datasets, not evidence that any particular article is indexed. Back up important library data before extensive batch modifications.

**Installation / coexistence note:** MetaFlow uses a distinct add-on ID from MetaRef/Linter. Do not enable overlapping metadata cleaners simultaneously. Some existing preferences continue to use the internal `metaref` namespace.

## Development & Testing

Run the following commands from the repository root. Follow project-specific test prerequisites before running native desktop validation.

```powershell
pnpm install --frozen-lockfile
pnpm test:unit
pnpm lint:check
pnpm build
``

These commands describe available project tasks, not a claim that every environment or integration test passes.

## Documentation & Support

[Metadata workflow](docs/metadata-workflow-zh.md) · [Database guide](docs/custom-journal-databases.md) · [Compatibility](docs/zotero11-compatibility.md)

[Open an issue](https://github.com/groele/Zotero-MetaFlow/issues) · [Browse source](https://github.com/groele/Zotero-MetaFlow)

## Acknowledgements & Attribution

Zotero MetaFlow was originally developed as a derivative of [northword/zotero-format-metadata](https://github.com/northword/zotero-format-metadata) by northword (Linter for Zotero). We acknowledge the original author and contributors for their foundational work. This Zotero Flow Series edition is independently maintained, is not an official release of the upstream project, and is not endorsed by Zotero. Original copyright and applicable third-party notices remain in force.

## License

Distributed under **AGPL-3.0-or-later**. See [LICENSE](LICENSE) and any applicable third-party notices for details.

Zotero and associated trademarks belong to their respective owners.
