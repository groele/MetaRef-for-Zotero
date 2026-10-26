# Zotero MetaFlow 12.5.7

Date: 2026-10-26. Includes the fixes from the unpublished 12.5.5 and 12.5.6 candidates.

## 修复与优化

- 期刊指标读取最新完整快照，保留指标移除和空快照，防止旧题名或 ISSN 别名恢复过期值；重启后仍然有效。同一毫秒更新或系统时间回退时保持更新顺序。
- 指标不变时也保存新发现的别名；残缺 ISSN 不作为共享键。同名但具有不同已知 ISSN 的期刊不互相覆盖或继承未选择的指标。索引保留 v1 容器和旧记录兼容性，无需清空用户数据。
- 批量保存事务失败后按处理前、拟保存和当前持久值进行恢复，保留其他写入者的独立字段；相同字段、条目类型等冲突明确报告并跳过保存。
- 请求与规则的限流队列支持立即取消，释放等待任务；直接 HTTP 调用在宿主取消器未结束底层 Promise 时也能退出。
- 原生缓存清理同时刷新中文补充来源的会话缓存，旧请求不能重新填回清理前的缓存。清理显示进行中和失败反馈，磁盘写入失败可重试。
- 设置使用一层主分组折叠，默认展开首组，内层保留静态小节与偏好绑定。按钮对齐 14px，补全中英文缓存有效期说明。
- 修复测试执行链路并实时输出原生测试进度；保留插件 ID、偏好前缀和 Zotero 兼容声明。

## Changes

- Read the latest complete journal-ranking snapshot, including intentional removals, and persist newly learned aliases. Keep distinct known ISSN identities separate without resetting the existing index.
- Preserve independent concurrent edits when retrying a failed batch transaction; report conflicting saves. Cancel queued work promptly and release direct HTTP callers even when native cancellation leaves the underlying promise pending.
- Clear supplemental-source responses with the native cache command and prevent older requests from repopulating the cleared cache. Report cache-write failures and allow retries.
- Use single-level settings groups, 14px buttons and corrected bilingual cache guidance. Preserve existing add-on identity, preferences and compatibility declarations.

## Validation and scope

85 unit files / 577 tests passed. Production build, source and test type checks, ESLint, AutoCorrect and release-tag syntax checks passed. All 202 isolated Windows Zotero 10.0.6 / Gecko 140 / zh-CN tests passed.

The exact production XPI passed 6 independent startup checks and 5 restart checks, including index removal, known ISSN isolation, the native cache command, disk persistence and four settings theme/width cases. Actual settings content widths were 944px and 800px.

Provider responses were controlled; these results do not certify public-provider availability. Zotero 11, other operating systems, main-profile installation and automatic-update installation were not revalidated. ISSNs receive format validation, not checksum validation; reads without a known ISSN retain the established title fallback. Earlier intermittent request-count and Windows temporary-file failures were not reproduced in final acceptance and are not claimed resolved.

## Package

- Asset: `zotero-metaflow.xpi` (3,472,899 bytes), add-on ID `metaflow@groele`, version `12.5.7`.
- SHA-256: `d1819e2ff8d7039cee99f0e1a24aa47078269cf2a8bdd8787325c8494514e692`.
- The existing raw-main update-feed endpoint is retained; its download link points to the fixed `v12.5.7` Release asset with the matching SHA-512 hash.
- Package and validation summary: [dist/verification.json](https://github.com/groele/Zotero-MetaFlow/blob/v12.5.7/dist/verification.json).
