# Zotero MetaFlow 12.6.10

Fix SVG rendering for the journal card share icon in the journal insights pane. Construct the share icon via DOM SVG elements in the standard SVG namespace instead of parsing markup within the pane document, ensuring the icon glyph displays reliably across themes.

589 unit tests across 86 test suites passed. Lint checks and production builds passed with verified manifest, SHA-256 and update feeds.
