# Zotero MetaFlow 12.5.8

Date: 2026-10-27.

## Changes

- Keep linked print/electronic ISSNs and former journal titles on the latest eligible snapshot, including older 12.5.7 rows. Distinct known ISSN groups remain separate.
- Record explicit negative memberships so stale Extra values cannot reappear in columns or the native pane. Preserve unrelated manual rankings and the original Extra field; later positive results clear removal markers.
- Preserve unreadable or unrecognized index files. Use session-only results with localized guidance to check logs and retry after restarting Zotero.
- Display actual JCR quartiles instead of membership flags or placeholders; use a valid SSCI or explicit JCR value when the SCI field is not a quartile.

期刊指标同步、旧 Extra 回退、异常索引保护和 JCR 分区显示均得到修正。插件 ID、偏好设置与 v1 索引容器保持兼容；旧记录缺少明确移除标记时不猜测其含义，重新查询后记录明确结果。

## Validation and scope

85 unit files / 587 tests passed. Production build, source and test type checks, ESLint, AutoCorrect and tag-policy self-tests passed. All 204 isolated Windows Zotero 10.0.6 / Gecko 140 / zh-CN tests passed.

The exact production XPI passed 6 startup, 4 restart and 4 unreadable-file checks. The native pane no longer displays a membership flag as a JCR quartile. Original Extra and unreadable index files remain unchanged.

Provider responses were controlled. Zotero 11, other operating systems, the complete settings theme/width matrix, main-profile installation and automatic-update installation were not revalidated. An earlier confirmation timeout and a previous cleanup timeout were not reproduced in final acceptance; their causes are not claimed resolved. Legacy rows without removal markers require a fresh verified lookup; title-only matching retains its established fallback.

## Package

- Asset: `zotero-metaflow.xpi` (3,473,300 bytes), add-on ID `metaflow@groele`.
- SHA-256: `6920945ab267a7bf6828216046a27e210a386b5644f84f52e6394ff16c98bd87`.
- The existing update-feed endpoint is retained, with the immutable `v12.5.8` asset URL and matching SHA-512 hash.
- Details: [dist/verification.json](https://github.com/groele/Zotero-MetaFlow/blob/v12.5.8/dist/verification.json).
