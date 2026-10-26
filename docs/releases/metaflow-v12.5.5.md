# Zotero MetaFlow 12.5.5 — local candidate

Date: 2026-10-25. Historical local candidate, superseded by 12.5.7. No 12.5.5 tag or GitHub Release was created; the candidate checksum and validation below record that earlier state.

直接 HTTP 调用在取消时及时退出，即使宿主取消器没有结束底层 Promise。

Validation: 557 core regression tests passed; production build and source/payload verification passed. All seven candidate XPIs loaded together in isolated Windows Zotero 10.0.6, with 16/16 checks on first launch and restart. Transport, notification failures, PDF worker and GitHub responses were controlled fixtures; MetaFlow used a separate native test bundle compiled from maintained source. No real Word workflow, online cloud mutation, paid AI, complete visual matrix or main-profile installation was performed.

Candidate SHA-256: `53aa0b599e22ec8afd8db58386f1d5f41dc4a235fa328b7961190db754a06c00`.

Full evidence: workspace `output/continued-development-20261025/开发与验收报告.md`. Stable release history and compatibility declarations are preserved.
