## no-item-duplication
rule-no-item-duplication =
  .label = No duplicate items added
rule-no-item-duplication-report-message = This item is a duplicate of an existing one.
rule-no-item-duplication-report-action = Go to merge
rule-no-item-duplication-search-failed = Unable to check duplicates in this library: { $error }


## no-article-webpage
rule-no-article-webpage =
  .label = No WebPage items linked to academic publishers
rule-no-article-webpage-report-message = The URL contains a major publisher domain, please confirm item type!


## no-journal-preprint
rule-no-journal-preprint =
  .label = No preprints typed as journal articles
rule-no-journal-preprint-report-message = This item has a preprint identifier but is typed as a journal article. Check its type and metadata.
rule-no-journal-preprint-report-action = Try updating metadata


## no-value-nullish
rule-no-value-nullish =
  .label = No nullish field values


## no-field-misuse
rule-no-field-misuse =
  .label = Clean up misused standard fields


## require-language
rule-require-language =
  .label = Language should be ISO 639-1 code
rule-require-language-menu-item =
  .label = Auto detect item language
rule-require-language-menu-field =
  .label = Auto detect (Zotero MetaFlow)

rule-require-language-option-only =
  .label = Limit recognized languages to improve accuracy
rule-require-language-option-only-cmn =
  .label = Chinese (zh)
rule-require-language-option-only-eng =
  .label = English (en)
rule-require-language-option-only-other = and
rule-require-language-option-only-other-desc = Enter a comma-separated list of additional ISO 639-1 codes.
rule-require-language-option-only-other-doc = ISO 639-1 codes
  .href = https://github.com/groele/Zotero-MetaFlow/blob/main/docs/features.md#require-language-require-language
rule-require-language-option-verify-before =
  .label = Skip processing if the language field is already a valid ISO 639-1 code


## require-short-title
rule-require-short-title =
  .label = Require short title


## correct-title-sentence-case
rule-correct-title-sentence-case =
  .label = Title should be sentence case
rule-correct-title-sentence-case-menu-item =
  .label = Convert title to sentence case
rule-correct-title-sentence-case-menu-field =
  .label = Sentence case (Zotero MetaFlow)

rule-correct-title-sentence-option-custom-term = Custom term:
  .label = Custom terms
  .placeholder = Path of custom terms file
rule-correct-title-sentence-option-custom-term-button =
  .label = Choose
rule-correct-title-sentence-option-custom-term-desc = Custom terms file should be CSV: first column search term, second column replacement, no headers. Regex supported. Separator must be comma or semicolon (no tabs).
rule-correct-title-sentence-option-disabled-languages = Disable automatic title conversion for item languages:
  .label = Disable automatic title conversion for item languages
  .placeholder = zh,ja,ko
rule-correct-title-sentence-option-disabled-languages-doc = ISO 639-1 alpha2 codes
rule-correct-title-sentence-option-disabled-languages-desc = Enter a comma-separated list of ISO 639-1 alpha2 language codes.


## correct-title-punctuation
rule-correct-title-punctuation =
  .label = Punctuation in title shoule be normalized
rule-correct-title-punctuation-menu-field =
  .label = Normalize punctuation (Zotero MetaFlow)
rule-correct-title-punctuation-quotes =
  .label = Convert quotes to curly


## correct-creators-punctuation
rule-correct-creators-punctuation =
  .label = Punctuation in creators shoule be normalized
rule-correct-creators-punctuation-menu-field =
  .label = Normalize punctuation hyphens (Zotero MetaFlow)


## correct-shortTitle-sentence-case
rule-correct-shortTitle-sentence-case =
  .label = ShortTitle should be sentence case
rule-correct-shortTitle-sentence-case-description = Shares config with '{ rule-correct-title-sentence-case.label }'


## no-title-trailing-dot
rule-no-title-trailing-dot =
  .label = No title ending with dot


## correct-title-chemical-formula
rule-correct-title-chemical-formula =
  .label = Automatically format chemical formulas in titles
rule-correct-title-chemical-formula-menu-item =
  .label = Format chemical formula subscripts and superscripts
rule-correct-title-chemical-formula-menu-field =
  .label = Chemical formula subscripts and superscripts (Zotero MetaFlow)


## require-creators
rule-require-creators =
  .label = Creators should be non-empty


## correct-creators-case
rule-correct-creators-case =
  .label = Creators should be capitalized
rule-correct-creators-case-menu-item =
  .label = Fix case of creators


## correct-creators-pinyin
rule-correct-creators-pinyin =
  .label = Chinese creators' Pinyin should be splitted (i.e. Zhang Sanfeng → Zhang San Feng)
rule-correct-creators-pinyin-menu-item =
  .label = Split creator Pinyin


## correct-date-format
rule-correct-date-format =
  .label = Date should be ISO YYYY-MM-DD format
rule-correct-date-format-menu-item =
  .label = Normalize date format to ISO
rule-correct-date-format-menu-field =
  .label = ISO format (Zotero MetaFlow)


rule-correct-filing-date-format =
  .label = Filing Date should be ISO YYYY-MM-DD format
rule-correct-issue-date-format =
  .label = Issue Date should be ISO YYYY-MM-DD format
rule-correct-priority-date-format =
  .label = Priority Date should be ISO YYYY-MM-DD format


## correct-extra-order
rule-correct-extra-order =
  .label = Extra fields should be in order
rule-correct-extra-order-menu-item =
  .label = Fix order of extra fields
rule-correct-extra-order-menu-field =
  .label = Fix order (Zotero MetaFlow)


## correct-publication-title-alias
rule-correct-publication-title-alias =
  .label = Publication title should be official name
rule-correct-publication-title-alias-menu-item =
  .label = Fix alias of publicationTitle
rule-correct-publication-title-alias-menu-field =
  .label = Fix alias (Zotero MetaFlow)


## correct-publication-title-case
rule-correct-publication-title-case =
  .label = Publication title should be Title Case
rule-correct-publication-title-case-menu-item =
  .label = Fix capitalization of publicationTitle
rule-correct-publication-title-case-menu-field =
  .label = Fix capitalization (Zotero MetaFlow)


## require-journal-abbr
rule-require-journal-abbr =
  .label = Journal abbreviations should be non-empty and ISO 4 format
rule-require-journal-abbr-menu-item =
  .label = Look up journal abbreviations
rule-require-journal-abbr-menu-field =
  .label = Lookup (Zotero MetaFlow)

rule-require-journal-abbr-option-infer =
  .label = Auto infer abbreviation via ISO 4 if missing
rule-require-journal-abbr-option-with-dots =
  .label = Keep periods in journal abbreviations
rule-require-journal-abbr-option-usefull = Use full name if abbreviation unavailable:
rule-require-journal-abbr-option-usefull-en =
  .label = English journal
rule-require-journal-abbr-option-usefull-zh =
  .label = Chinese journal
rule-require-journal-abbr-option-custom-data-label = Custom abbreviations file:
rule-require-journal-abbr-option-choose-custom-abbr-data-button =
  .label = Choose
rule-require-journal-abbr-option-choose-custom-abbr-data-input =
  .placeholder = Path of custom abbreviation file
rule-require-journal-abbr-option-custom-data-desc =
  Supports JSON or CSV.
  JSON: `"publicationTitle": "abbreviation"`.
  CSV: first col = full title, second col = abbreviation. Separator must be comma or semicolon (no tabs).


## tool-query-esi
rule-tool-query-esi =
  .label = Check ESI journal disciplines (no field writes)
rule-tool-query-esi-menu-item =
  .label = Get Journal ESI Category
tool-query-nature-index =
    .label = Identify Nature Index journals
tool-query-nature-index-menu-item =
    .label = Identify Nature Index journals
tool-query-nature-index-description = Show journal membership in the independent section and list column. No tags or Archive Location values are written; membership does not prove article inclusion.

rule-tool-query-esi-option-format = List column display format:
rule-tool-query-esi-option-format-desc = Supported variables: { "{" }subject{ "}" } (Chinese name, e.g. "物理学"), { "{" }category{ "}" } (Uppercase English, e.g. "PHYSICS"), { "{" }en{ "}" } (English title case, e.g. "Physics"). Default: { "{" }subject{ "}" }ESI.
rule-tool-query-esi-option-custom-data-label = Custom dataset file:
rule-tool-query-esi-option-choose-custom-data-button =
  .label = Browse
rule-tool-query-esi-option-choose-custom-data-input =
  .placeholder = Path of custom ESI dataset
rule-tool-query-esi-option-custom-data-desc = Supports JSON and CSV. Built-in data uses Clarivate's 2026 Release 6 master list: 12,245 normalized journals across all 22 ESI fields. A custom file replaces the built-in list.


## require-doi
rule-require-doi =
  .label = DOI should be non-empty
rule-require-doi-menu-item =
  .label = Retrieve DOI by title
rule-require-doi-menu-field =
  .label = Retrieve DOI (Zotero MetaFlow)


## no-doi-prefix
rule-no-doi-prefix =
  .label = No URL prefix for DOI
rule-no-doi-prefix-menu-item =
  .label = Remove DOI prefix
rule-no-doi-prefix-menu-field =
  .label = Remove URL prefix (Zotero MetaFlow)


## correct-doi-long
rule-correct-doi-long =
  .label = Correct DOI to long format


## correct-pages-connector
rule-correct-pages-connector =
  .label = Pages connector should be `-` or `,`


## correct-pages-range
rule-correct-pages-range =
  .label = Review page range inferred from PDF


## no-issue-extra-zeros
rule-no-issue-extra-zeros =
  .label = No issue numbers starting with 0


## no-pages-extra-zeros
rule-no-pages-extra-zeros =
  .label = No page numbers starting with 0


## no-volume-extra-zeros
rule-no-volume-extra-zeros =
  .label = No volume numbers starting with 0


## correct-conference-abbr
rule-correct-conference-abbr =
  .label = Conference abbreviation should be in extra.shortConferenceName
rule-correct-conference-abbr-menu-item =
  .label = Look up conference abbreviations
rule-correct-conference-abbr-description = Shares config with '{ rule-require-journal-abbr.label }'


## correct-thesis-type
rule-correct-thesis-type =
  .label = Thesis type should include the word "thesis/dissertation"


## correct-university-punctuation
rule-correct-university-punctuation =
  .label = Brackets in university names should match language style


## require-university-place
rule-require-university-place =
  .label = University place should not be empty
rule-require-university-place-menu-item =
  .label = Fill university place
rule-require-university-place-menu-field =
  .label = Lookup (Zotero MetaFlow)


## correct-edition-numeral
rule-correct-edition-numeral =
  .label =  Edition should be numeral


## correct-volume-numeral
rule-correct-volume-numeral =
  .label =  Volume should be numeral


## correct-bookTitle-sentence-case
rule-correct-bookTitle-sentence-case =
  .label = Book title should be sentence case


## correct-proceedingsTitle-sentence-case
rule-correct-proceedingsTitle-sentence-case =
  .label = Proceedings title should be sentence case


## tool-title-guillemet
rule-tool-title-guillemet =
  .label = Convert 〈〉 and 《》 in title
rule-tool-title-guillemet-menu-item =
  .label = { rule-tool-title-guillemet.label  }


## tool-creators-ext
rule-tool-creators-ext =
  .label = Apply creators extended
rule-tool-creators-ext-menu-item =
  .label = { rule-tool-creators-ext.label  }


## tool-set-language
rule-tool-set-language =
  .label = Manually set item language
rule-tool-set-language-menu-item =
  .label = { rule-tool-set-language.label }


## tool-update-metadata
rule-tool-update-metadata =
  .label = Retrieve item metadata via identifier
rule-tool-update-metadata-menu-item =
  .label = Zotero MetaFlow: Update Metadata
rule-tool-update-metadata-option-semanticScholarToken = Semantic Scholar API Key:
  .label = Semantic Scholar Token
  .placeholder = Semantic Scholar Token
rule-tool-update-metadata-option-semanticScholarToken-desc =
  When updating field data, the plugin queries its bibliographic data from Semantic Scholar.
  The API key is stored in Zotero preferences and displayed as a password. Request a key to use Semantic Scholar's authenticated quota.
rule-tool-update-metadata-option-semanticScholarToken-link = Request API key

rule-tool-update-metadata-option-slient =
  .label = Use default settings without confirmation each time
rule-tool-update-metadata-dialog-title = Update Item Metadata
rule-tool-update-metadata-dialog-mode = Update Mode
rule-tool-update-metadata-dialog-mode-all =
  .label = All Fields
rule-tool-update-metadata-dialog-mode-blank =
  .label = Blank Fields Only
rule-tool-update-metadata-dialog-allow-type-changed =
  .label = Allow Change Item Type
rule-tool-update-metadata-dialog-notes = Notes
rule-tool-update-metadata-dialog-note-rate-limit = Some APIs have rate limits; please avoid bulk processing.
rule-tool-update-metadata-dialog-note-chinese-limit = Chinese titles may use CNKI search. A unique title match is required; access restrictions or verification pages may prevent results.
rule-tool-update-metadata-dialog-note-type-change = In “All Fields” mode, allowing an item-type change may make Zotero remove fields that the new type does not support or change creator roles. Review the result after updating.


## tool-get-short-doi
rule-tool-get-short-doi-menu-item =
  .label = Retrieve short DOI


## tool-csl-helper
rule-tool-csl-helper =
  .label = CSL-M Field Helper
rule-tool-csl-helper-menu-item =
  .label = { rule-tool-csl-helper.label }
rule-tool-csl-helper-menu-field =
  .label = { rule-tool-csl-helper.label } (Zotero MetaFlow)


## tool-clean-extra
rule-tool-clean-extra =
  .label = Clean extra fields
rule-tool-clean-extra-menu-item =
  .label = { rule-tool-clean-extra.label }
rule-tool-clean-extra-empty = No extra fields found.
rule-tool-clean-extra-select = Select fields to clean

rule-correct-title-chemical-formula-option-normalize-spaces =
  .label = Remove extra spaces inside formulas and around heterostructure separators
rule-correct-title-chemical-formula-description = Enable to include formulas in standard metadata checks and automatic processing of new items. Disabled by default; run separately from the context menu or Ctrl+Alt+S (Cmd+Option+S on macOS). Handles MoS2, Fe(NO3)3 and Fe3+ while preserving existing scripts and nocase markup. Ambiguous abbreviations such as C4 or P3 need review. Menu visibility does not enable the automatic rule.
rule-no-article-webpage-report-action = Try updating metadata
rule-require-journal-abbr-custom-data-error = Custom abbreviations are unavailable; using built-in data: { $error }
rule-tool-update-metadata-no-identifiers = No usable identifier or URL was found.
rule-tool-update-metadata-no-data = No usable metadata was found. { $errors }
rule-tool-update-metadata-service-warning = Metadata updated via { $service }; some services failed: { $errors }
rule-tool-update-metadata-invalid-date = Invalid access date from the service; the original value was preserved.
rule-tool-update-metadata-invalid-creators = Invalid creator types from the service; the original creator list was preserved.
rule-tool-update-metadata-type-change-loss = Changing the item type would remove existing fields or change creator roles. The original type was preserved in blank-only mode; compatible empty fields were updated.
rule-tool-query-esi-custom-data-error = Custom ESI data are unavailable; using built-in data: { $error }
rule-tool-update-easyscholar = Look up and save journal rankings
rule-tool-update-easyscholar-description = Query EasyScholar rankings and save them to MetaFlow's local index, or also write them to Extra when enabled in settings. Run manually or explicitly enable lookups for added items. Supplemental sources have separate switches.
rule-tool-update-easyscholar-menu-item = Look up EasyScholar journal information
rule-tool-update-easyscholar-no-title = The item has no journal or conference title to look up.
rule-tool-update-easyscholar-unconfigured = Enter an EasyScholar API key in MetaFlow settings first.
rule-tool-update-easyscholar-not-found = EasyScholar returned no ranking data for “{ $title }”.
rule-tool-update-easyscholar-no-fields = EasyScholar returned a record for “{ $title }” but no ranking fields that can be written.
rule-tool-update-easyscholar-unchanged = The selected EasyScholar fields for “{ $title }” already match the current Extra content.
rule-tool-update-easyscholar-failed = EasyScholar lookup failed: { $error }
rule-tool-update-easyscholar-updated = Retrieved and saved { $count } journal fields for “{ $title }”.
rule-tool-update-easyscholar-cleared = Removed outdated index markers for “{ $title }” based on the latest EasyScholar response.
rule-no-field-misuse-review = Review { $field }: “{ $value }” may be metadata from another tool. The original value was preserved.
rule-no-value-nullish-review = Review { $field }: “{ $value }” may be a placeholder or legitimate text. The original value was preserved.
rule-tool-update-metadata-identity-conflict = Skipped the result from { $service }: its identity conflicts with this item or could not be verified.
rule-tool-update-metadata-incomplete = Core metadata is still missing; please review: { $fields }.
rule-tool-update-metadata-edited = { $field } changed while waiting for the service. Its current value was preserved.
rule-tool-update-metadata-type-fields-preserved = The original item type was preserved to avoid losing these fields: { $fields }.
rule-tool-update-metadata-type-roles-preserved = The original item type was preserved to keep the existing creator roles.
rule-tool-update-metadata-field-source = Updated { $field }. Source: { $source }.
rule-require-creators-missing = No creators are recorded. Please check the source.
rule-doi-unresolvable = This DOI could not be resolved.
rule-doi-missing = This item has no DOI.
rule-doi-invalid = This DOI is invalid.
rule-short-doi-failed = ShortDOI request failed: { $status }.
rule-short-doi-empty = No ShortDOI was returned.
tool-guillemet-choice = Conversion direction
tool-guillemet-double = Single 〈〉 to double { "\u300A\u300B" }
tool-guillemet-single = Double { "\u300A\u300B" } to single 〈〉
tool-guillemet-title = Convert title brackets
tool-creators-mark = Marker
tool-creators-country = Country
tool-creators-country-hint = Use existing creator information from Extra when empty
tool-creators-title = Creator annotations
tool-language-choice = Select a language
tool-language-input = Or enter a language
tool-language-title = Set item language
tool-single-item-only = Select one item to use this tool.
rule-rollback-failed = A failed rule could not be restored. Processing and saving this item were stopped; its stored state was reloaded when available.

## Library maintenance tools
rule-tool-creators-style = Annotate authors with bold or stars, or remove annotations
rule-tool-creators-style-menu-item = Annotate authors with bold or stars, or remove annotations
    .label = Annotate authors with bold or stars, or remove annotations
rule-tool-creators-swap = Swap creator first and last names
rule-tool-creators-swap-menu-item = Swap creator first and last names
    .label = Swap creator first and last names
rule-tool-title-replace = Find and replace text in item titles
rule-tool-title-replace-menu-item = Find and replace text in item titles
    .label = Find and replace text in item titles
rule-tool-publication-replace = Find and replace publication titles
rule-tool-publication-replace-menu-item = Find and replace publication titles
    .label = Find and replace publication titles
rule-tool-clear-all-extra = Clear all Extra content of selected items
rule-tool-clear-all-extra-menu-item = Clear all Extra content of selected items
    .label = Clear all Extra content of selected items
maintenance-author-action = Operation
maintenance-author-name = Author name (leave blank for all creators)
maintenance-author-bold = Add bold
maintenance-author-star = Add a star
maintenance-author-both = Add bold and a star
maintenance-author-removeBold = Remove bold
maintenance-author-removeStar = Remove stars
maintenance-author-removeAll = Remove bold and stars
maintenance-find = Find text (literal match)
maintenance-replacement = Replace with (may be empty)
maintenance-replace-all = Replace every occurrence in each field
maintenance-find-required = Find text must not be empty. No items were changed.
maintenance-clear-extra-confirm = Clear all Extra content in { $count } selected items, including manual notes and other plugins' fields?
metadata-auto-update-on-added = Fill missing article metadata when items are added
    .label = Fill missing article metadata when items are added
metadata-auto-update-description = Off by default. Requires automatic checking of added items. Queries article identifiers or Chinese titles, fills empty fields, and keeps item types.

rule-tool-update-easyscholar-supplemental-failed = Some supplemental sources failed: { $error }

rule-tool-update-easyscholar-disabled = No journal output fields are enabled; lookup skipped.
rule-tool-update-easyscholar-source-deadline = EasyScholar lookup failed or exceeded its source deadline.
rule-tool-update-easyscholar-summary = “{ $title }”: { $returned } returned, { $selected } selected; Extra keys added: { $added }, changed: { $updated }, removed: { $removed }.

rule-tool-update-easyscholar-no-selected-results = The response contains no usable values for the selected fields. Existing information was preserved.

abbr-match-ambiguous = The title matches conflicting abbreviations. Automatic replacement was skipped; use an exact title or custom mapping.
abbr-result = Journal abbreviation: { $value }; source: { $source }.
abbr-source-custom = Custom mapping
abbr-source-builtin = JabRef built-in mapping
abbr-source-iso4 = Offline ISO 4 inference
abbr-source-full = Full-title fallback
rule-fields-edited = Skipped a delayed result because these fields changed while waiting: { $fields }. Current values were preserved.

rule-correct-pages-range-review = The PDF has { $total } pages; the candidate range is { $range }. Check the published pagination for covers or supplements and enter it manually. No change was made.
