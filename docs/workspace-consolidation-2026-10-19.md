# Workspace comparison and consolidation

## Scope and decisions

Compared the uncommitted legacy root workspace at `748d041` with the maintained source based on `0eb6a68`. The comparison normalized line endings and excluded dependencies, generated output, binary packages, and screenshot evidence. These results describe the compared files, not a claim of exhaustive behavior equivalence.

| Area | Evidence | Decision |
| --- | --- | --- |
| Rules and settings | All 49 legacy rule IDs occur among the 58 maintained IDs; no legacy default preference keys are missing | Keep the maintained registry and settings layout |
| Source interfaces | No exported function, class, constant, interface, or type from a changed legacy source file is missing from its maintained counterpart | Keep the maintained lifecycle, runner, metadata, cache, and UI implementations |
| Unique legacy source | `src/utils/http.test.ts` contains five useful cancellation, retry, and shared-request tests | Restore all five; verified against the current implementation |
| Unique legacy documents | Six historical audits, layout descriptions, or release notes | Preserve in the external archive, rather than restore stale maintenance instructions |
| Journal abbreviations | 26,700 legacy mappings versus 44,304 maintained mappings; some removed records contain tab characters or obsolete spellings | Keep the current reproducible generator, source profiles, provenance, and ISO 4 fallback |
| Journal fallback checks | Precision Radiation Oncology; Journal of Wuhan University of Technology Materials Science Edition; Philosophical Transactions of the Royal Society B | Verified offline ISO 4 output without copying malformed legacy records |
| PR #2 | Two explicit Extra-output settings already integrated; the pane now uses its independent index | Explicitly disable Extra output in the pane test and verify the manual note is unchanged; retire the superseded branch |
| Current CI failures | Two assertions still expected completed task controls after those controls were intentionally removed | Verify no detailed completion panel appears while preserving aggregate results, history, and cancellation checks |
| E2E failure visibility | HTTP passthrough mocks called Zotero methods without their required receiver, hiding reporter requests | Preserve `Zotero.HTTP` as the receiver and add failure-stack diagnostics independent of Error serialization |
| Windows fresh checkouts | Global automatic CRLF conversion made the XHTML formatter reject a clean checkout | Pin text checkouts to LF in `.gitattributes`, retaining the existing binary-file rules |

After recovering the HTTP tests, the compared text inventory contained 175 identical files, 93 different files, six legacy-only documents, and 187 maintained-only files. Source diffs and a machine-readable inventory were retained with the local consolidation evidence.

## Final layout

- The repository root is the single maintained source checkout.
- Local `main` tracks `origin/main`; GitHub retains only `main` after integration.
- `.scaffold/` contains generated build and isolated-test files only.
- The legacy workspace is archived outside the project, including its uncommitted files and unrelated Git history.
- Release tags remain as history. The stable release and update feed remain `11.1.0`; source-only test and repository cleanup do not publish a release.

Use `pnpm` and the root commands in `AGENTS.md`. Do not recreate nested publishing checkouts or use archived package names to select an installable version.

## Validation in the promoted root checkout

- Frozen-lockfile dependency installation completed successfully.
- 537 unit tests across 83 files passed, including the five recovered HTTP tests.
- All 187 isolated Zotero 10.0.6 / Gecko 140 integration tests passed, including installation and verification of the production XPI.
- `pnpm lint:check`, `pnpm exec tsc --noEmit --project test/tsconfig.json`, and diff whitespace checks passed.
- The archived legacy worktree retained exactly the same 157 status entries as the pre-migration snapshot; its worktree links were repaired.
- Historical audit pages with obsolete source-directory instructions are explicitly marked as historical records.

This maintenance changes test coverage, repository instructions, and checkout hygiene. It does not change production feature logic or publish a new version.
