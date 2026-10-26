# Journal ranking index consistency

The profile file `metaflow-journal-rankings-v1.json` retains container version 1, with optional `issns` identity metadata on new snapshots. Older rows without that metadata remain readable. The index is separate from item metadata and the API response cache.

Each entry is a complete snapshot of the known rankings for its journal or conference, indexed by available ISSNs and the normalized title. A partial update starts with the latest eligible snapshot and preserves its unselected fields. Blank mode retains existing selected values. Readers choose the eligible snapshot with the greatest `updatedAt`; they must not fill its missing fields from an older alias, because an absent value can record an intentional removal. Existing equal timestamps retain the established ISSN-before-title lookup priority.

Eligibility preserves known ISSN identities. A title snapshot explicitly associated with a different ISSN group cannot override an already known ISSN entry. Writes also refuse to inherit unselected fields from that conflicting group. A title-only read can still reuse an established title association when no ISSN entry is known, as before; a verified write with a different ISSN starts its own snapshot. Legacy title rows without identity evidence retain their historical lower priority than a known ISSN row. Shared ISSNs confirmed by a matching snapshot remain attached to partial and title-only updates.

An explicit empty `values` object is valid and must survive loading: all previously known values may have been removed. Invalid field payloads are not converted into empty removal records. New timestamps use the current clock or one millisecond beyond the matching aliases, whichever is later. This preserves update order within the same millisecond and during a system-clock correction; `updatedAt` does not identify a provider's ranking edition or dataset year.

A newly learned title or ISSN alias is saved even when the selected metric values are unchanged. Identical values with no new alias do not trigger another disk write. ISSN keys require a complete seven-digit-plus-check-character value; partial identifiers cannot join unrelated journals. This is format validation, not ISSN checksum validation.

The existing entry limit, atomic write path, retry-after-write-failure behavior and newer-format read-only behavior remain in place. No index reset or destructive migration is needed for these corrections.

Supplemental-source responses use a separate ten-minute session cache. The settings cache-clear command clears it alongside the EasyScholar and Semantic Scholar caches. A generation token prevents requests started before clearing from repopulating that session cache; cancellation of the request's caller is still governed by its AbortSignal.

Regression evidence includes alias removal, an empty snapshot across reload, a title update during clock rollback, learning an unchanged alias, malformed partial ISSNs, explicit supplemental clearing and an older request completing after clearing. Production acceptance additionally exercises real item-tree columns, the native preferences command, disk persistence and restart in an isolated Zotero profile.
