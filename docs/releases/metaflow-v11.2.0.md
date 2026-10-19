# Zotero MetaFlow 11.2.0

Released on 2026-10-19. This release adds a shared metadata source preference and quieter, actionable completion feedback, and incorporates the stability fixes developed after 11.1.0.

## Added and changed

- Choose **Prefer local data** or **Prefer cloud data** under metadata settings. This replaces the separate blank/overwrite wording and preserves existing preferences. Both core commands use the same choice for enabled online steps; the setting does not enable extra network requests.
- Local priority preserves existing bibliographic fields and fills blanks. Author completion remains separately configurable. Cloud priority updates populated fields after identity checks; a verified exact DOI match can resolve title, date and author differences. Different DOIs, unverified sources and insufficient title/PDF evidence remain protected. Empty source fields never erase local content.
- Completed operations use native bottom-right notifications that disappear after five seconds. Clicking or activating a notification opens that operation's report. Core completion removes the inline running bar and shows one notification; records remain available in runtime history.
- Metadata identity comparison recognizes equivalent HTML and MathML formula titles. Report headings display translated rule names instead of internal identifiers.
- Retain the integrated batch duplicate workflow, serialized core commands, bounded persistent caches and runtime records, cancellation safeguards and transaction recovery fixes from the post-11.1.0 candidate.

- Reorganized settings by task: grouped automatic-import switches, promoted journal rankings and sources, moved source priority before advanced rules, and consolidated notification/performance controls with runtime data. The 259 existing preference bindings are preserved.

## Compatibility and data

The add-on ID remains `metaflow@groele`. Existing preferences and local cache/history files are reused; no library migration is required. Automatic imports retain their separate blank-only policy. Journal abbreviation and ranking source preferences remain independent. Preprints remain preserved and linked to their published versions.

The manifest targets Zotero 10.0–11.x. Zotero 11 evidence from earlier candidates is development-build coverage, not a guarantee for every future host or third-party combination. The earlier commercial-readiness limitations remain documented in [the audit ledger](../commercial-readiness-2026-10-18.md); this release does not claim universal commercial certification.

## Verification

The final package version, SHA-256, size, host results and exact verification scope are recorded in [`dist/verification.json`](../../dist/verification.json). Unit, native-host, settings-binding and production-installation checks validate functionality; external provider responses are controlled fixtures. Real-account quotas, all third-party combinations and long-duration large-library workloads are outside this release's verification scope.

## 使用说明

在“设置 → 元数据来源与采纳偏好 → 元数据来源优先级”选择本地或云端优先。默认本地优先；作者补全遵循独立开关。云端优先不会跳过不同 DOI 和证据不足的保护，也不会自动启用联网。完成通知位于右下角，5 秒后自动消失，点击查看本次报告。历史记录和已有设置继续保留。
