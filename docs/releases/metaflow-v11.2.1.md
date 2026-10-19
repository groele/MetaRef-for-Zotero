# Zotero MetaFlow 11.2.1

Released on 2026-10-19.

- Remove the core command bottom bar throughout execution and after completion. Both core commands now show their stage and stop action in a native bottom-right notification.
- Retile native completion notices after window-manager geometry settles and when the main window resizes.
- Preserve five-second completion notices, click-to-open reports and persistent runtime records. Detailed reports never open automatically.
- Prevent a progress notification closed during asynchronous initialization from attaching stale controls. Cancellation remains scoped to the current core workflow.

## Verification

See `dist/verification.json` for the exact package hash, tested host and targeted regression scope. Previous full-suite evidence belongs to 11.2.0; this patch rechecks the affected progress, cancellation, core command and packaged-installation paths. Zotero 11 and long-duration third-party workloads were not rerun for this patch.

## 使用说明

更新元数据和检查修复元数据全程不再显示底部横条。运行进度和停止操作统一放在右下角；完成提示保留 5 秒，点击才打开报告，记录继续写入本地运行历史。
