# Zotero MetaFlow 12.6.1

Date: 2026-10-28.

- Restore the native bottom-right notification window for duplicate batch confirmation, progress and results.
- Remove the feedback panel below the item list. Keep cancellation and the final summary available when the duplicate pane switches.
- Closing the notification or unloading its owner cancels pending work and removes notification observers.

批量合并的确认、进度和结果改用 Zotero 原生右下角提示窗口，不再占用条目列表底部。保留取消及完成摘要，关闭提示窗时取消后续处理。

Validation: 587 unit tests and 11 isolated Windows Zotero 10.0.6 native checks passed. Native checks cover actual merging, cancellation, unload cleanup, notification closing, bottom-right geometry and four light/dark normal/narrow views. Source/test TypeScript, ESLint, AutoCorrect, production build and release-version self-checks passed. The production XPI ZIP/manifest was verified; this iteration did not install that XPI into a profile; main-profile and automatic-update installation were not performed. Zotero 11 and other operating systems were not tested.


Asset: `zotero-metaflow.xpi`, 3,477,021 bytes, add-on ID `metaflow@groele`.

SHA-256: `2add47aa05be8d076291c394be1c363f9a0679d4075e6e527a2a0f893aca2aed`.
