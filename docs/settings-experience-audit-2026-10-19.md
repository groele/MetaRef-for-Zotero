# Settings experience audit — 2026-10-19

## Scope and evidence

The audit followed automatic import, both core commands, metadata source priority, journal metrics, duplicate policy and runtime maintenance. Native Zotero settings were captured before and after the changes in the current run, and their preference controls were inventoried. The UI was checked against workflow, rule, cache and persistence handlers rather than inferred from captions alone.

Both inventories contain **259 preference-bound controls**, with the same keys and no duplicate bindings. Existing settings are preserved. Screenshot captures were taken in an isolated profile; no user-library preferences or records were changed.

## Findings and corrections

| Finding | Impact | Correction |
| --- | --- | --- |
| Journal metrics, API credentials and index data sources were nested under detailed metadata rules | Users could miss a major feature while looking for journal configuration | Promoted the existing group to **Journal rankings, indexes and data sources**; controls and handlers are reused |
| Metadata adoption policy followed detailed rules and abbreviations | A common decision required searching through unrelated settings | Placed source/adoption policy immediately after core commands; its main policy card opens with the section |
| Import-related switches were split between general settings and journal configuration | The complete automatic workflow was difficult to inspect | Collected metadata, journal-query and group-library import switches under **Automatic import and background processing** |
| Some import switches appeared usable when their master switch was off | Saved choices could look active without executing | Disable dependent controls when automatic import is off, preserving their stored choices for re-enabling |
| Notifications, concurrency and migration diagnostics were mixed with import options | Technical and infrequent controls competed with routine setup | Moved them into the existing data/cache/runtime area |
| Concurrency initialization depended on the first numeric input in the DOM | Reordering settings could accidentally bind validation to another control | Bind explicitly to the concurrency preference key |
| Item-type help text described a retired override behavior | Users could expect ordinary metadata updates to change types | Explain that ordinary updates preserve type and preprint publication lookup preserves and links versions |

## Resulting structure

1. Automatic import and background processing
2. Context menu and core commands
3. Metadata sources and adoption policy
4. Duplicate settings
5. Journal rankings, indexes and data sources
6. Journal abbreviations
7. Detailed metadata rules
8. Data, cache and runtime feedback
9. On-demand tools
10. Shortcuts, rich-text tools and About

Routine work remains accessible through the two core commands. Destructive or infrequent maintenance stays in on-demand tools. Workflow category switches and detailed rule switches operate on the same preferences; they are synchronized views, not additional execution passes. Metadata adoption priority and journal-index source priority serve different data domains and remain independent.

## Verification and limits

The affected native settings suite passed 21 checks, including actual control persistence, import dependencies, stable field/module bindings, source priorities, narrow-window layout and input labels. Separate native captures verified the new structure. Final release-level unit, host, package and hash verification is recorded in `dist/verification.json`.

This audit does not claim full screen-reader certification or complete third-party coexistence. The screenshots demonstrate actual native rendering, while behavior and persistence checks provide separate implementation evidence. Heavy network capabilities remain opt-in; changing layout adds no new requests or library scans.
