# Zotero MetaFlow 12.5.6 — local candidate

Date: 2026-10-25. Historical local candidate, superseded by 12.5.7. No 12.5.6 tag or GitHub Release was created; the candidate checksum and validation below record that earlier state.

本轮系统检查覆盖规则执行、元数据写入、请求与缓存、设置绑定、工程验证及生产安装包。保留原有规则、偏好设置、MetaRef 内部标识和 Zotero 兼容范围。

- 批量保存事务失败后，按处理前、拟保存和当前持久值合并单条重试；保留其他写入者修改的独立字段。相同字段或条目类型冲突时跳过保存，并在报告中明确列出冲突。
- 外部请求与规则的限流队列支持立即取消；取消的等待任务释放监听与计时器，不再占用后续请求的启动时段。保留完整的请求启动间隔。
- 清除 API 缓存时显示进行中状态并防止重复触发；磁盘写入失败或遇到较新缓存格式时显示失败并恢复重试，避免误报成功。
- 设置页只保留主分组的一层折叠，默认展开第一组；内层功能使用静态小节，保留原有控件、事件与偏好绑定。按钮实际字号对齐 14px。
- 修正缓存说明：EasyScholar 成功响应 72 小时，Semantic Scholar 成功响应 24 小时，无期刊结果的成功响应最多 5 分钟。
- 保留 12.5.5 中直接 HTTP 请求及时响应取消的修复，即使宿主取消器未结束底层 Promise。
- 实机测试脚本复用当前 pnpm，并实时输出测试进度；修复既有测试的可空样式类型错误。增加额外请求的脱敏来源诊断；Windows 测试临时文件收尾仅对瞬时原子替换拒绝作有限重试，保留正文中的写入失败断言。

Validation evidence is recorded in the workspace task folder `output/metaflow-system-optimization-20261025/`. Unit tests, native Zotero tests, final production-package installation and visual checks are separate evidence layers. Controlled provider responses do not establish public-service availability; the user's main profile, public update feed and GitHub releases are unchanged.

Final validation: 85 unit files / 567 tests passed; production build, source and test type checks, ESLint and AutoCorrect passed. The complete isolated Windows Zotero 10.0.6 / Gecko 140 / zh-CN suite passed all 202 tests. The final production XPI passed 3 independent initial-startup checks and 3 restart checks, including single-level settings, failure/retry feedback and four theme/width cases. Host window limits resulted in actual content widths of 944px and 800px.

Candidate SHA-256: `1faced99149de1cf44cf0e6b27ce6ed2b8707375498c4b72022530012008aac6`. Source review and package verification details, including intermediate failures and remaining coverage limits, are in the task report.

At candidate validation, public README downloads still identified stable 12.5.4. That generated local candidate feed was verification evidence and did not activate an online update.
