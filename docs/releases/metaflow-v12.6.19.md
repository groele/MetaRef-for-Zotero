# Zotero MetaFlow 12.6.19

修复实际菜单「更新元数据」经 core workflow / metadata review 执行时未接入 ISSN 补全的问题。review 字段白名单增加 ISSN；在同一 runner 中于审核规则之后执行空白 ISSN 查询，即使无文章标识符或文章查询失败仍尝试按完整期刊名补全。保留已有 ISSN，检查等待期间 DOI、期刊名及 ISSN 的修改，使用 runner 事务保存。无可确认结果或服务不可用时报告未补全。

同时修复成功对号在窗口失焦时因动画结束事件延迟而不按时恢复的问题，改由窗口定时器恢复，重复点击和卸载清理计时。

隔离 Zotero 5/5 专项通过，包括使用 Nano Letters、无 DOI，调用与菜单一致的 hooks.onLintInBatch(..., {review:true})，确认 ISSN 1530-6984 并保存重载。此前旧规则直接调用验收没有覆盖真实菜单路由；本次已补该回归。606 项单元测试通过，新增白名单回归所在文件 16 项通过；TypeScript、相关 ESLint、生产构建通过。候选版本未发布，未安装到主 profile。
