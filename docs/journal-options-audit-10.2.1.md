# MetaFlow 10.2.1：期刊索引设置逐项核验

本轮检查以当前源代码、受控接口响应和 Windows Zotero 10 的实际运行结果为依据。测试使用隔离配置及测试密钥，不读取或展示用户真实密钥。

## 已修复问题

1. 会议论文原先可查询并保存评级，右侧期刊索引面板却仅允许期刊文章。现在两类条目均能显示已保存评级；会议论文不会附带不适用的本地 ESI/Nature Index 结论。
2. 自动查询原先通过 runner 直接执行，遗漏面板状态同步。现在成功、未命中、错误和取消状态进入同一面板并刷新。
3. 面板原先忽略信息级查询结果，“未命中”和“所有输出已关闭”会变成笼统成功提示。现在保留具体状态，仅将成功写入的详细统计收敛为简短提示。
4. 接口返回空官方评级和空自定义评级时，原先被当作成功。现在判定未匹配，不清除已有信息。
5. 接口返回的数据不含所选字段时，显示明确提示，保留原有内容。

## 设置与数据流

| 设置 | 实际行为 | 核验方法 |
| --- | --- | --- |
| API 密钥及测试连接 | HTTPS 请求；空密钥不请求；忙碌期间阻止重复操作；错误遮盖密钥 | 单元及真实设置窗口的受控 HTTP 测试 |
| 新增期刊或会议自动查询 | 需要同时启用“新增条目自动检查”和 EasyScholar 自动查询；可编辑、非回收站条目才处理 | 真实 notifier/runner 流程及自动失败状态刷新 |
| 61 个输出字段 | 勾选控制下一次写入；仅更新返回且被选择的字段 | 每个字段单独启用的单元测试；真实窗口逐个点击保存 |
| 61 个列表列开关 | 控制 Zotero 列菜单中的自定义列注册 | 全部 61 个列开关逐一验证持久化及对应列实际注册/注销 |
| 自定义数据库 | 读取服务返回的已启用自定义评级；缺少账户权限或数据时保留原值 | 自定义 UUID 解析测试；不等同于账户权限在线验证 |
| 独立补充来源 | 仅选择补充字段时不请求 EasyScholar；来源失败不覆盖已有值 | 独立来源、超时和部分成功测试 |
| 右侧期刊索引 | 显示所有已保存指标；修改后刷新；切换条目清理旧内容；渲染不请求网络 | 真实 Zotero 全 61 行展示及会议条目测试 |

数据链路：设置复选框 → 原有偏好 → 来源解析 → 仅合并选中字段 → runner 保存 Extra → 刷新“Zotero MetaFlow 期刊索引”。Extra 作为持久化载体，人工备注保留。取消勾选控制后续写入，不删除此前保存的数据，也不立即重新查询。连接测试验证密钥请求，不会给当前文献写入 Nature 的数据。

索引面板中的最近查询状态保留在当前插件会话；已保存评级通过 Extra 跨会话保留。独立 ESI/Nature Index 数据与 API 评级各自保留来源边界。

## 全部输出字段

| 字段 | 保存键 | 来源 |
| --- | --- | --- |
| `jcr` | JCR 分区 | EasyScholar 官方 |
| `casUpgrade` | 中科院分区升级版 | EasyScholar 官方 |
| `casBasic` | 中科院分区基础版 | EasyScholar 官方 |
| `casSmall` | 中科院升级版小类分区 | EasyScholar 官方 |
| `casTop` | 中科院升级版 Top 分区 | EasyScholar 官方 |
| `casWarning` | 中科院预警 | EasyScholar 官方 |
| `newSharp` | 新锐分区 | EasyScholar 官方 |
| `newSharpTop` | 新锐 Top 分区 | EasyScholar 官方 |
| `newSharpSmall` | 新锐小类分区 | EasyScholar 官方 |
| `newSharpWarning` | 新锐预警 | EasyScholar 官方 |
| `impactFactor` | 影响因子 | EasyScholar 官方 |
| `impactFactor5Year` | 5 年影响因子 | EasyScholar 官方 |
| `sci` | SCI | EasyScholar 官方 |
| `ssci` | SSCI | EasyScholar 官方 |
| `ei` | EI | EasyScholar 官方 |
| `ahci` | AHCI | EasyScholar 官方 |
| `jci` | JCI | EasyScholar 官方 |
| `esi` | ESI | EasyScholar 官方 |
| `ajg` | AJG | EasyScholar 官方 |
| `ccf` | CCF | EasyScholar 官方 |
| `fms` | FMS | EasyScholar 官方 |
| `utd24` | UTD24 | EasyScholar 官方 |
| `ft50` | FT50 | EasyScholar 官方 |
| `cssci` | CSSCI/南大核心 | EasyScholar 官方 |
| `pku` | 中文核心期刊/北大核心 | EasyScholar 官方 |
| `cscd` | CSCD | EasyScholar 官方 |
| `technologyCore` | 中国科技核心期刊 | EasyScholar 官方 |
| `swufe` | 西南财经大学 | EasyScholar 官方 / 大学目录 |
| `cufe` | 中央财经大学 | EasyScholar 官方 / 大学目录 |
| `uibe` | 对外经济贸易大学 | EasyScholar 官方 / 大学目录 |
| `sdufe` | 山东财经大学 | EasyScholar 官方 / 大学目录 |
| `xdu` | 西安电子科技大学 | EasyScholar 官方 / 大学目录 |
| `swjtu` | 西南交通大学 | EasyScholar 官方 / 大学目录 |
| `ruc` | 中国人民大学 | EasyScholar 官方 / 大学目录 |
| `xmu` | 厦门大学 | EasyScholar 官方 / 大学目录 |
| `sjtu` | 上海交通大学 | EasyScholar 官方 / 大学目录 |
| `fdu` | 复旦大学 | EasyScholar 官方 / 大学目录 |
| `hhu` | 河海大学 | EasyScholar 官方 / 大学目录 |
| `scu` | 四川大学 | EasyScholar 官方 / 大学目录 |
| `cqu` | 重庆大学 | EasyScholar 官方 / 大学目录 |
| `nju` | 南京大学 | EasyScholar 官方 / 大学目录 |
| `xju` | 新疆大学 | EasyScholar 官方 / 大学目录 |
| `cug` | 中国地质大学 | EasyScholar 官方 / 大学目录 |
| `cju` | 长江大学 | EasyScholar 官方 / 大学目录 |
| `zju` | 浙江大学 | EasyScholar 官方 / 大学目录 |
| `cpu` | 中国药科大学 | EasyScholar 官方 / 大学目录 |
| `clsci` | CLSCI | EasyScholar 自定义 |
| `ccfCustom` | CCF 推荐目录 | EasyScholar 自定义 |
| `ami` | AMI | EasyScholar 自定义 |
| `nssf` | NSSF | EasyScholar 自定义 |
| `swupl` | 西南政法大学 | EasyScholar 自定义 |
| `scopus` | Scopus | EasyScholar 自定义 |
| `abdc` | ABDC | EasyScholar 自定义 |
| `hx` | HX | EasyScholar 自定义 |
| `coreRankings` | CORE Rankings | EasyScholar 自定义 |
| `esci` | ESCI | EasyScholar 自定义 |
| `predatoryReports` | 掠夺性期刊预警 | EasyScholar 自定义 |
| `compoundIF` | 复合影响因子 | 独立补充来源 |
| `comprehensiveIF` | 综合影响因子 | 独立补充来源 |
| `njauCore` | 南农核心 | 独立补充来源 |
| `njauQuality` | 南农高质量 | 独立补充来源 |

## 验证边界

真实窗口测试使用受控网络响应，因此能确认设置、解析、保存、显示及失败处理链路，但不能证明用户密钥当前有效、所有期刊均有数据、自定义库权限齐全或旧补充网站持续可访问。真实 EasyScholar 账号返回、知网及部分旧目录的正向在线验收仍需分别验证；本轮不宣称全部上游在线来源已验证。

本轮安装包版本为 10.2.1；不代表已推送 GitHub。

## 本轮结果

- 单元测试：56 个文件、330 项通过。
- 完整真实 Zotero 测试：69 项通过，包含生产 XPI 安装。
- 全部列注册/注销补充验收：7 项通过。
- 生产构建、TypeScript 检查、ESLint、AutoCorrect 通过。
