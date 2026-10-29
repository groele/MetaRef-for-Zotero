# Zotero MetaFlow 12.6.14

Refactored journal card sharing notifications to use Zotero's native ProgressWindow toast notification:
- Notification popups appear in the bottom-right corner of the Zotero window, adhering to native UI guidelines.
- Removed custom floating DOM overlay in favor of official Zotero toolkit integration (`ProgressWindow`), complete with plugin icon and auto-dismiss timing.
- Seamlessly integrates with silent copy (image/text) and preview modal sharing modes.

590 unit tests across 86 test suites passed. Production builds and lint checks passed with verified manifest and update metadata.
