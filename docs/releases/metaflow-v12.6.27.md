# Zotero MetaFlow 12.6.27

- Fix the collapsed journal-index header reserving an extra line for its empty summary. The MetaFlow row now returns to the native single-row height; the overall Zotero details sidebar keeps its normal full-window height.

Validation: production build and TypeScript passed with pnpm 12.3.4; 88 unit-test files / 611 tests passed; ESLint and AutoCorrect passed; XPI CRC, manifest identity/version and update-feed SHA-512 matched. Package: 3,487,766 bytes; SHA-256 `36ba3eb1083c08d41a37935953edd206b3d095a4865df01dfd9085f66187785d`.

Live Zotero validation was not performed. No isolated Zotero 10/11 executable is configured, and the visible desktop host is Zotero 7.0.27, outside this repository's declared test range. The main profile was not modified. Automatic update installation, Zotero 11, macOS/Linux and manual theme acceptance remain unverified.
