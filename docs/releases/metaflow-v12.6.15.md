# Zotero MetaFlow 12.6.15

Enriched missing journal ISSNs in the "Update Metadata" online enrichment workflow:
- **OpenAlex & Crossref Integration**: When an item's ISSN is missing, queries OpenAlex and falls back to Crossref using either the item's DOI or journal publication title.
- **Strict Scope & Field Validity**: Safely targets item types permitted to hold an ISSN (`journalArticle`), strictly protecting existing data under blank fill mode.
- **Normalization**: Automatically cleans and normalizes retrieved ISSNs to standard 8-character hyphenated uppercase format (`XXXX-XXXX`).
- **Resilience**: Operates within the online "Update Metadata" lifecycle, preserving offline integrity of "Check and Repair Metadata" with robust error and cancellation isolation.

599 unit tests across 87 test suites passed. Production builds and lint checks passed with verified manifest and update metadata.
