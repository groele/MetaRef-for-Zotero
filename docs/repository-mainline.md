# Repository mainline and checkout rules

Last verified: 2026-10-19

## One product release line

`groele/Zotero-MetaFlow` keeps only `main` (`origin/main`) on GitHub after integration and cleanup. Version tags and merged commits retain release history. The source version and stable update feed are 12.5.1, released as `v12.5.1`. Release notes and `dist/verification.json` record the package and validation scope.

PR [#5](https://github.com/groele/Zotero-MetaFlow/pull/5) was merged into `main` at `0eb6a68`, and its feature branch was deleted. Do not publish the beta XPI or its update metadata through the stable feed.

PR [#2](https://github.com/groele/Zotero-MetaFlow/pull/2) proposed explicit EasyScholar Extra-output preferences in three tests. The author and partial-provider tests already include those fixes on `main`. The journal-pane test now explicitly disables Extra output and verifies that rankings remain in the independent index without modifying the manual note. This preserves the useful test-isolation change while matching the current behavior. The superseded PR was closed and its source branch removed after validation.

Keep development branches temporary: validate their changes, integrate useful work into `main`, then delete them. GitHub automatically deletes merged pull-request branches. At the end of maintenance, verify the complete branch list through the GitHub API rather than relying on the recent-branches dropdown.

## Authoritative local source

The maintained checkout is the repository root. Local `main` tracks `origin/main`. Before any code edit, release, or build:

1. Change directory to the repository root.
2. Check `git status --short --branch`, `git remote -v`, and `git log -1 --oneline --decorate`.
3. Build and test only from this checkout.
4. Fetch the latest `origin/main` before starting work. If a temporary branch is used, integrate and remove it when the work is complete.

The historical root checkout was based on unrelated `upstream/main` history at `748d041`, with uncommitted local work. It was compared with the maintained source before retirement. All 49 legacy rule IDs and all legacy preference keys were retained; five useful HTTP regression tests were recovered. The old files and Git history were archived outside the project, and the maintained source was promoted from the nested publishing worktree to an independent root checkout. See the [comparison record](workspace-consolidation-2026-10-19.md).

`.scaffold/` is ignored generated output only. Do not maintain another source checkout there or rebuild an archived workspace. With a clean working tree, refresh the source using `git fetch --prune origin` and `git pull --ff-only`. Pushes to GitHub `main` must remain fast-forwards from the current remote commit.

## History and branch cleanup

Keep release tags such as `V11.1.0` and merged commits. Before deleting a branch, inspect its unique changes and associated PR. For squash merges, compare the resulting tree or patches rather than relying only on ancestry. Integrate useful changes first; close obsolete PRs only after confirming their fixes are already present or superseded. Do not rewrite or join the archived `upstream/main` history into MetaFlow.

The surrounding workspace contains verification artifacts and older audit snapshots. They are evidence, not source trees and not build inputs. Never install or distribute an artifact solely because its filename looks newer; verify its commit, version, environment marker, and recorded hashes.
