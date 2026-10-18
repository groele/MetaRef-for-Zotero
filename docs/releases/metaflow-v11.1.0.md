# Zotero MetaFlow 11.1.0

MetaFlow now runs its two core commands as complete workflows, fills verified metadata automatically, and handles multiple duplicate groups in one batch. Runtime summaries and API caches have separate, bounded storage.

## Added

- Automatic metadata decisions based on identifiers, source identity and corroborating evidence. Ambiguous or conflicting results preserve local data.
- Bulk duplicate-group selection with primary-item previews, pause, resume and stop controls. Native Zotero merging preserves supported notes, attachments, tags and collections.
- An inline task status strip with stage progress, stop, results and dismiss actions.
- A local runtime history file with atomic writes, recovery snapshots and retention limits of 30 days, 200 runs and 2 MiB.

## Changed

- Core commands queue as complete workflows, share repeated clicks and produce one history entry per command. Summary counts deduplicate items across stages while retaining every stage's evidence.
- Metadata filling no longer opens an identifier picker, confirmation dialog or field-review panel. Blank-only and overwrite settings still apply. Duplicate merging retains an explicit decision step.
- Menu visibility and command execution settings share one settings section. Cache controls, runtime records and reports are grouped together; detailed rules are collapsed initially.
- Cache duration and capacity vary by service. Cache hits do not extend expiration or rewrite unchanged files. Equivalent journal prefetches are deduplicated and concurrency is bounded.

## Fixed

- Preserve author-repair settings when creating related publication versions, and reject stale metadata and relationship proposals.
- Retain earlier failures and saved changes when later workflow stages complete.
- Keep duplicate batches responsive and cancellable during dense candidate enumeration; a failing progress observer does not interrupt sibling merges.
- Flush pending persistence through Gecko's shutdown barrier and recover runtime records from the previous valid snapshot.

## Upgrade and compatibility

The add-on ID and preference namespace remain unchanged. Existing settings and historical releases are retained. Title/PDF fallback searches, version lookup and expensive duplicate review remain separately configurable. Runtime summaries are diagnostic records, not a library backup or an undo log.

Targets Zotero 10.0–11.x. Native validation uses Windows Zotero 10.0.6 / Gecko 140 and Zotero 11.0-dev.5+dac1ad489 / Gecko 153. Zotero 11 coverage is development-build coverage. No universal third-party coexistence, cross-platform or long-duration large-library compatibility claim is made.

## Verification

The implementation passed 519 unit tests across 80 files, ESLint, AutoCorrect, production and test TypeScript checks, and production packaging. The beta candidate passed 103 broader native checks on Zotero 11 and 61 affected checks on each host. The final 11.1.0 production package passed 61 affected native checks on each host, including production XPI installation. Exact results and the package SHA-256 are recorded in `dist/verification.json`. Online providers use controlled responses.
