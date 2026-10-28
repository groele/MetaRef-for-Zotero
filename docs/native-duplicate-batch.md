# Native duplicate batch merge

Introduced in Zotero MetaFlow 12.6.0.

The native Duplicate Items pane includes **Merge all duplicates in this library** below Zotero's single-group merge button. It scans the current library, shows the number of groups and the master strategy, and requests one confirmation for the whole batch. In 12.6.1, confirmation, progress and the final summary use Zotero's native bottom-right progress window, remaining visible when the native pane switches after merging the last group. Users can cancel between groups and dismiss the final summary. Closing the notification cancels pending work. No feedback panel is inserted below the item tree.

## Merge policy

- The target library is captured when the button is clicked. A single active operation and the existing runner queue prevent overlapping MetaFlow batches.
- `Zotero.Duplicates.getSearchObject()` and `getSetItemsByItemID()` supply native groups, including ISBN matches. Temporary detector tables are dropped after reading their results. Quick-search filters and the selected duplicate group do not narrow the library scan.
- The existing `duplicates.masterStrategy` preference chooses the master; the default is the oldest item. Missing fields are filled in stable group order, conflicting fields retain the master value, missing creators are filled, and unique Extra lines are combined.
- Each group must contain editable, unchanged, regular items of one type in the captured library. A recorded non-duplicate decision between any two members skips the whole group. The optional cross-type setting of MetaFlow's separate review workflow does not enable cross-type native batches.
- `Zotero.Items.merge()` delegates to the host's `mergeItems.mjs` transaction. The host moves attachments, notes, collections, tags, relations and citation replacement keys and records its own Undo action. The plugin does not wrap that call in another transaction. Each group is a separate host merge/Undo action.
- A failed merge reloads the affected items and children before the next group. Cancellation retains already completed merges. The final summary distinguishes merged items, skipped groups and failed groups.
- Window unload, shutdown and repeated initialization remove the controls and observer and cancel pending confirmation or work.

## Host boundary and validation

The detector methods and native pane element IDs are internal host interfaces verified against the installed Windows Zotero **10.0.6 / Gecko 140** source. The existing manifest range remains 10.0–11.*; this change does not claim new Zotero 11 validation. If an incompatible host removes an interface, the batch reports the error; the original single-group merge control remains available. `Zotero.Items.merge()` is a deprecated compatibility entry point in 10.0.6 that forwards to `mergeItems.mjs`, also used elsewhere in the plugin.

On 2026-10-27: 587 unit tests and 213 native E2E tests passed, including 9 new native batch cases and production XPI installation. A separately installed production XPI passed 3 initial and 3 restart checks in an isolated profile. Four native light/dark and normal/narrow views passed with a 14px button and no local horizontal overflow; the host minimum window width was 943px and the right pane was 320px. This is Windows coverage, not macOS/Linux or screen-reader acceptance.

The independent installation checks used a copy of the completed E2E test database. Initial empty-library acceptance attempts encountered a database initialization timeout before functional tests; this remains an environment-level validation gap. No main-profile installation, public Release or automatic-update installation was performed.

The native behavior is documented by [Zotero's duplicate detection guide](https://www.zotero.org/support/duplicate_detection). The installed host source and actual tests are the authority for the APIs used here.
