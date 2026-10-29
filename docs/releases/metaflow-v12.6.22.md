# Zotero MetaFlow 12.6.22

- Clarify that silent sharing copies exactly one representation, selected in preferences: card image or formatted text. Image mode does not add a text clipboard flavor; text mode does not add an image flavor.
- Keep the existing preference key and default image selection, and clarify the setting description in Chinese and English.

Validation: 608 unit tests passed. Production build, source/test TypeScript checks, ESLint, AutoCorrect and tag-policy self-test passed. Windows Zotero isolated checks passed 10/10. GitHub Actions run 40839278527 (attempt 2) passed its production build and all 217 native Zotero tests. The XPI ZIP, manifest identity/version, immutable update URL and SHA-512 were checked against the package bytes.

Not verified: paste into PowerPoint or other external applications, installation in the user's main Zotero profile, and actual automatic-update installation.
