# Zotero MetaFlow 12.6.16

修复空白 ISSN 补全被文章元数据查询失败提前跳过的问题。优先 Crossref DOI 查询，OpenAlex DOI 回退，再按完整期刊名匹配。修正 Crossref singleton URL；校验 ISSN 格式与校验位，保留已有值与查询期间的手动编辑，取消后停止回退。沿用 runner 的保存事务。

候选版本，尚未发布或安装。API 依据：https://api.crossref.org/swagger-ui/index.html。
