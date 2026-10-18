# Repository mainline and checkout rules

Last verified: 2026-10-18

## One product release line

`groele/Zotero-MetaFlow` has one release branch: `main` (`origin/main`). At this check it points to `3c744e6` and the stable release is `V11.1.0`. Version tags and merged commits are the historical record; old version branches are not separate maintained product lines.

Development for the next candidate happens on a short-lived feature branch and returns to `main` through a pull request. The current candidate is `codex/metaflow-commercial-readiness` at `8331213`, with draft PR [#5](https://github.com/groele/Zotero-MetaFlow/pull/5). It is not the stable line until merged and released. Do not publish its beta XPI or update metadata through the stable feed.

An unrelated open draft PR (`copilot/fix-failing-github-actions-job`, PR #2) is a test-only change. It is not a MetaFlow release line. Keep it separate until its owner or reviewer resolves it.

## Authoritative local source

The maintained checkout is `.scaffold/publish/metaflow-10.0.1/`. The directory name is historical; its Git branch and commit, package version, and release metadata determine its actual state. Before any code edit, release, or build:

1. Change directory to this maintained checkout.
2. Check `git status --short --branch`, `git remote -v`, and `git log -1 --oneline --decorate`.
3. Build and test only from this checkout.
4. Start feature work from the current `origin/main` or the explicitly selected candidate branch, and use a pull request to return it to `main`.

The parent checkout at the workspace root is a legacy worktree on local `main` (`748d041`), based on `upstream/main`, not the MetaFlow release branch. It has no merge base with the maintained release history and currently contains 157 modified, deleted, or untracked paths. Preserve those files as local work; do not build, stage, reset, clean, merge, or publish from that checkout. The nested maintained checkout is a separate Git worktree and is the only source of truth for MetaFlow changes.

## History and branch cleanup

Keep release tags such as `V11.1.0` and merged commits. They are the historical record, not competing lines. Delete local version branches only after confirming they are merged into `origin/main`; delete a remote branch only after confirming its pull request is merged and the tag or merge commit retains the history. Do not rewrite or join the legacy `upstream/main` history into MetaFlow. Do not remove the open PR #2 branch as part of routine version-branch cleanup.

The surrounding workspace contains verification artifacts and older audit snapshots. They are evidence, not source trees and not build inputs. Never install or distribute an artifact solely because its filename looks newer; verify its commit, version, environment marker, and recorded hashes.
