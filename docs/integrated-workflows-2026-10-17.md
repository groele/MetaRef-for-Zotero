# MetaFlow 功能分工、整合与执行效率审查

> 历史记录：本文记录 beta.1 的整合状态与测试结果。当前流程、可选步骤和修复情况以 [核心工作流专项审计](core-workflow-audit-2026-10-18.md) 为准。

日期：2026-10-17。维护源码：`.scaffold/publish/metaflow-10.0.1`。本地候选版：`10.7.0-beta.1`，未发布。原始父工作区及已发布的 `dist` 更新源不作为本轮编辑对象。

## 1. 两个入口与后台自动执行

默认文献右键只显示“检查并修复元数据”和“更新元数据”。关闭“右键仅显示两个核心命令”可以恢复各工具原有的菜单位置设置。标题富文本工具栏、快捷键和设置页的按需工具继续可用；隐藏菜单不会自动启用工具。

| 执行路径 | 职责 | 默认网络行为 | 修改边界 |
| --- | --- | --- | --- |
| 自动导入校验 | 合并近邻导入通知，运行已启用的本地格式规则，记录缺项和疑似重复 | 本地校验不联网。远程元数据补全和期刊查询保留独立开关，默认关闭 | 按规则开关处理；默认不合并条目、不替换版本，不执行维护工具 |
| 检查并修复元数据 | 主动检查所选条目的完整度、格式、类型和重复问题，修复确定性的格式错误 | 默认本地；远程作者核验、组合元数据补全和期刊查询须分别开启 | 不会默认查询每一条文献的作者或 DOI；有歧义的类型、重复和缺项只提供待处理项 |
| 更新元数据 | DOI/ShortDOI、ISBN、PMID/PMCID、arXiv 核验；无标识符时尝试身份匹配的标题查询；正式发表版本管理 | 用户主动触发联网 | 先显示来源及字段差异，默认仅勾选空字段；覆盖须选中字段，身份差异须确认；标识符不一致禁止采纳 |
| 设置页按需工具 | 字段批量替换、语言指定、作者交换与标注、Extra 清理、CSL、ShortDOI、独立查询和文件夹入口 | 依工具原有功能 | 不因界面精简而自动执行；原有确认和参数步骤保留 |

自动导入仍遵守总开关、群组独立开关、可编辑状态、已删除条目和订阅条目过滤。自动流程在后台记录结果，不强制弹出详细报告。设置中的最近批次报告可查看实际保存的字段及来源。

## 2. 全部规则与工具的归属

注册表包含 40 项常规规则和 18 项工具，共 58 项。以下为执行职责，而非一律强制开启；已有用户规则偏好继续有效。

| 功能组 | 已有规则或能力 | 自动导入／本地检查 | 联网更新／按需操作 |
| --- | --- | --- | --- |
| 基础完整性 | `no-value-nullish`、`no-field-misuse`、`require-creators` | 清理明确占位符，提示字段错用及缺失作者；保留有歧义的人工值 | 更新入口可核验并补全作者，逐字段采纳 |
| 类型与版本提醒 | `no-article-webpage`、`no-journal-preprint` | 只检查和提示，不自动迁移类型 | 更新入口核对预印本正式版；有明确依据后更新原条目或创建关联正式版 |
| 重复条目 | `no-item-duplication`、`tool-review-duplicates` | 默认只提醒；报告中的操作直接进入差异核对界面 | 去重设置提供主条目策略、批量合并、非重复标记和迁移 |
| 标题 | `no-title-trailing-dot`、`correct-title-punctuation`、`correct-title-sentence-case` | 按已有开关本地整理 | 单独标题转换、引号及替换工具移至按需入口 |
| 科学标题 | `correct-title-chemical-formula`、自定义术语、富文本与 nocase | 化学式自动规则继续默认关闭；开启后本地执行 | 选区上下标、斜体、粗体及大小写保护保留工具栏与快捷键 |
| 短标题与书籍题名 | `require-short-title`、`correct-shortTitle-sentence-case`、`correct-bookTitle-sentence-case`、`correct-proceedingsTitle-sentence-case` | 按各开关本地运行；不强制开启原先关闭的会议题名规则 | 人工精修保留原生编辑能力 |
| 作者格式 | `correct-creators-punctuation`、`correct-creators-case`、`correct-creators-pinyin` | 本地标点与大小写；拼音转换继续由原开关控制 | 指定作者风格、交换姓名及扩展工具按需执行；在线核验集中到更新入口 |
| 日期 | `correct-date-format`、`correct-filing-date-format`、`correct-issue-date-format`、`correct-priority-date-format` | 仅适用类型执行本地规范化 | 单独日期工具从按需入口调用 |
| 语言 | `require-language`、`tool-set-language` | 本地识别语言，遵守原有语言限制 | 强制指定语言仅按需 |
| DOI | `no-doi-prefix`、`require-doi`、`correct-doi-long`、`tool-get-short-doi` | 本地移除前缀，报告 DOI 缺项；不默认执行查找或 ShortDOI 网络解析 | 更新入口解析 ShortDOI 并核对完整 DOI；生成 ShortDOI 保留独立工具 |
| 期刊与会议 | `correct-publication-title-alias`、`correct-publication-title-case`、`require-journal-abbr`、`correct-conference-abbr` | 使用本地全称、别名、缩写数据和离线 ISO 4 引擎 | 期刊名称批量替换按需执行 |
| 卷期页 | `correct-pages-connector`、`correct-pages-range`、`no-issue-extra-zeros`、`no-pages-extra-zeros`、`no-volume-extra-zeros` | 按开关修正规范；不推断不存在的出版页码 | 页码与文章编号差异由报告提示，保留人工核对 |
| 学位论文 | `correct-thesis-type`、`correct-university-punctuation`、`require-university-place` | 使用本地类型与高校地点表 | 不联网生成学校或学位事实 |
| 版次与卷数 | `correct-edition-numeral`、`correct-volume-numeral` | 本地数词格式转换 | 保留单独执行能力 |
| Extra | `correct-extra-order`、`tool-clean-extra`、`tool-clear-all-extra`、`tool-csl-helper` | 只按原规则整理顺序 | 清理、全部清空和 CSL 人工编辑不进入自动流程 |
| 期刊评价 | `tool-query-esi`、`tool-query-nature-index`、`tool-update-easyscholar` | 名单与列展示复用本地索引；自动远程查询须单独开启 | 更新入口按开关更新已采纳条目的期刊信息；独立查询保留在设置工具中 |
| 维护与标注 | `tool-creators-style`、`tool-creators-swap`、`tool-creators-ext`、`tool-title-replace`、`tool-publication-replace`、`tool-title-guillemet` | 不自动执行 | 设置页按需操作，保留参数及原有保存边界 |
| 核验与版本工具 | `tool-review-metadata`、`tool-review-preprint` | 不自动联网执行 | 融入核心更新界面，并保留设置页独立入口 |

## 3. 核验、补全与版本处理

1. 优先读取条目已有标识符。缺少可用标识符时，只读取已有 PDF 全文缓存前 32 KB，展示 DOI/arXiv 候选和上下文，让用户选择；不上传 PDF，不把参考文献中的 DOI 自动写回父条目。
2. ISBN 校验包括校验位及 ISBN-10/13 对应关系。DOI 返回值必须一致；PMID/PMCID 必须有对应返回标识。解析失败、未找到数据和身份冲突不等同于文献不存在。
3. 没有标识符时，可按标题调用现有查询服务；候选仍须通过标题及年份匹配，不因“搜索有结果”而直接采纳。
4. arXiv 查询核对基础标识符；普通元数据查询保留明确版本约束。正式版查询允许查找同一预印本的当前记录，只接受 arXiv 明确关联的出版 DOI，不按近似标题猜测出版关系。
5. 原条目更新保留条目 ID、附件及笔记，将预印本来源及迁移时不兼容的字段保存在 Extra。另一种方式是新建或复用同文库已有出版记录，建立双向关联并保留预印本。
6. 用户核对期间，任何条目内容或可编辑状态发生变化，均拒绝使用旧快照写回。取消不采纳字段。
7. 当前版本管理以 arXiv 为明确支持范围；尚不宣称覆盖 bioRxiv、medRxiv 等全部平台的版本关系，也不自动下载或替换 PDF。

## 4. Zoplicate 设置功能的整合

官方设置页核对来源：[preferences.xhtml](https://github.com/ChenglongMa/zoplicate/blob/main/addon/chrome/content/preferences.xhtml)、[默认设置](https://github.com/ChenglongMa/zoplicate/blob/main/addon/prefs.js)。能力整合进 MetaFlow 的执行器和设置页，不依赖同时安装原插件。

| 设置类 | 已整合项目 | 行为 |
| --- | --- | --- |
| 默认操作 | 保留新导入、保留已有、保留全部、始终询问 | 默认保留全部。自动合并只针对 DOI 相同且版本兼容的记录；询问模式进入核对界面 |
| 主条目 | 最早添加、最新添加、最近修改、最详细 | 用于核对界面的建议保留项及批量合并；导入的保留新／旧策略优先确定对应候选 |
| 并发 | 1–8，默认 3 | 将重复对聚合成互不重叠的组，组间有界并发，组内顺序合并。每个条目只进入一个组，不在并发任务中重复处理 |
| 不同类型 | 可选跨类型合并，默认关闭 | 仍要求相同 DOI 及兼容版本；选择不兼容字段最少的类型，备份不能保留的字段。预印本与正式版不因此自动合并 |
| 统计 | 重复组／条目数量、刷新按钮 | 追加到 Zotero“重复条目”标签；按需计算，不在菜单渲染中查询数据库；修改条目或非重复判定后清除旧数字，计算期间发生变更则不显示过期结果 |
| 非重复记录 | 标记误报、导入、导出 | 使用文库与稳定条目键，兼容 `zoplicate-nonduplicates` v1 JSON；验证文件及条目，合并记录，不覆盖原有判定。不写不受支持的同步设置 |
| 批量控制 | 核对所选、合并当前文库、暂停／继续、停止 | 操作前展示范围。暂停与停止均等待已经开始的原生提交完成；停止保留已完成操作，可使用原生撤销 |

同一 DOI 不能单独证明两个版本一定相同；明确不同的 arXiv 版本或预印本／正式版关系仍被拦截。标题匹配只作为候选依据，DOI 冲突不自动合并。

默认保留项的空字段会从另一个条目补齐，非冲突 Extra 行合并保留；手动核对时可逐字段指定来源。附件、笔记、批注及引用重定向交由 Zotero 原生合并机制处理，不另写一套文件搬运逻辑。

## 5. 删除的重复等待与优化措施

| 原问题 | 调整 | 检验方式 |
| --- | --- | --- |
| 本地检查隐式联网核验所有作者或查找 DOI | 默认本地化；联网作者核验需单独开启，DOI 缺项变为带更新操作的提醒 | 记录 HTTP 请求数，对手动检查和自动导入均断言 0 次隐式请求 |
| 无适用条目仍准备规则、加载数据 | 在 prepare 前按类型筛选；纯不适用批次仍准确报告不适用条目 | 单元测试断言不调用无关规则的 prepare |
| 同一标识符在一批中重复查询 | 复用本批已取得的证据，各条目重新比较自身字段与冲突 | 证据缓存仅限当前批次，不改变服务必要的速率限制 |
| 每次未变化的检查重复扫描文库 | 复用重复查询；条目新增、修改、删除等通知及非重复判定更新使缓存失效 | 单元测试覆盖共享、失效、失败重试与进行中的查询失效 |
| 同一组的 N 条记录生成多次合并任务 | 预先聚合互斥组，组内依次重新验证和合并 | 实机测试 3 条同组记录只合并 2 次，两个组共合并 3 条 |
| 插件事务包住原生合并事务，引发自等待 | 原生合并独占自身提交边界；关联创建单独使用一次事务 | 实机验证正常合并及附件、笔记、标签、分类保留 |
| 菜单条目多、同一规则多个入口重复出现 | 默认只保留两个核心命令；低频工具放设置页，异常处理入口跟随发现出现 | 实机打开原生菜单，断言只有两个可见主命令 |
| 导入阶段同时执行重复提醒及自动去重扫描 | 用户选自动去重或询问模式时，导入常规阶段跳过重复提醒扫描，由去重处理阶段统一完成 | 自动导入测试验证默认保留与显式保留新条目 |
| 设置页在插件停用再启用后保留旧界面、丢失监听 | 停用时注销原生设置页并清除注册状态，重新启用后由宿主重新加载 | 完整实机回归先停用再启用插件，再逐项验证设置持久化及行为 |
| 精简菜单影响设置页记忆的菜单位置 | 设置页读取用户保存的位置；菜单渲染再应用精简策略 | 实机验证隐藏、恢复、一级及子菜单位置切换 |

受控场景基线：Windows Zotero 10.0.6，40 条文献，模拟 DOI 响应延迟 15 ms。最终复测为显式 DOI 查询 40 次／1,526 ms，本地检查 0 次／159 ms，自动导入本地检查同样无网络请求。这是特定测试条件的结果，不代表所有资料库或真实服务上的统一加速比例。最终交付验证目录中的 `workflow-performance-zotero10.json` 和 `workflow-performance-zotero11.json` 分别保存两个宿主的复测数据。

## 6. 验证记录与边界

最终通过 73 个测试文件中的 480 项单元测试；Windows Zotero 10.0.6／Gecko 140 和 Zotero 11.0-dev.5+dac1ad489／Gecko 153 各通过 121 项完整实机测试，均包含生产 XPI 替换安装及内置数据读取。构建、TypeScript、ESLint、AutoCorrect 和差异空白检查通过。去重统计标签及误报排除后的统计失效也已通过实机断言。XPI SHA-256、两个宿主测试日志和性能记录见交付目录的 `verification.json` 及 `verification/`。

本次交付为 `10.7.0-beta.1` 本地候选包；未安装到主用户资料库，未提交、推送或发布到 GitHub，公开更新源保持原版本。

验证覆盖原生核对界面、逐字段采纳、取消、快照过期、ISBN、PDF 缓存、arXiv 返回版本核对、原位更新、关联创建、合并保留、完整去重设置持久化、非重复判定迁移、跨类型字段保留、自动导入默认行为、组合队列及生产 XPI 安装。

外部服务在确定性回归中使用受控响应；这不能证明每个真实服务、账号权限或全部第三方插件组合可用。Zotero 11 验证仅针对指定开发版，不代表所有未来版本。非重复判定为本地存储及手动迁移，不宣称自动跨设备同步。批量停止不尝试仅恢复回收站条目来冒充完整撤销。本轮未进行大型资料库长时间运行及交互式暂停／继续／停止压力测试。

设计调研参考：[ZotMeta](https://github.com/RoadToDream/ZotMeta)、[DOI Manager](https://github.com/bwiernik/zotero-shortdoi)、[arXiv Workflow](https://github.com/AllanChain/zotero-arxiv-workflow)、[Zoplicate](https://github.com/ChenglongMa/zoplicate)。原项目版权与许可证独立保留；本轮未直接打包这些插件。
