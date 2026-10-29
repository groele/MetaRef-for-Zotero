# Zotero MetaFlow 12.6.23

- Skip complete item exports when a rule has made no writes, including empty rollback checks.
- Defer batch baseline serialization until an item actually has changes.
- Discard journal-ranking disk reads that finish after an index reset.

Validation: 611 unit tests passed across 88 files. Production build, source/test TypeScript, full ESLint, AutoCorrect and tag-policy self-test passed. Windows Zotero 10.0.6 / Gecko 140 isolated regression: 216 native tests passed; the production installation test passed separately after correcting the test invocation and rebuilding in the default directory. The final XPI identity, version, bundled script, resources and SHA-512 update hash were verified in the installation test. Intermediate test setup failures are retained in the audit evidence.

SHA-256: `1bff9b8f31ce69d4d1bd2c36eaffc82a3e15d95acba69bf0e8cfe1042a6627f2`

Limits: no measured real-library speedup percentage; no main-profile installation, actual automatic-update installation, new Zotero 11 validation, macOS/Linux validation or manual theme acceptance. Custom build output directories remain unsupported by the fixed script output path; use the default build command.
