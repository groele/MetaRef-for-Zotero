# Zotero MetaFlow 12.6.13

Added configurable sharing mode controls in settings:
- **Share Mode (`insights.shareMode`)**: Choose between **Silent one-click copy** (default, directly copies to clipboard without opening any popup window) and **Preview popup window** (opens the full card preview modal with options to copy image, save image, or copy formatted text).
- **Silent Copy Format (`insights.shareSilentFormat`)**: In silent mode, users can further select whether to copy the journal card image (default) or formatted text to clipboard.
- The bottom-left floating notice adapts to the selected format ("Zotero Meta Flow 期刊索引图片已复制" or "Zotero Meta Flow 期刊索引文本已复制").
- Settings UI adheres to Zotero Flow design standards with 14px controls, 13px descriptions, and interactive state synchronization.

590 unit tests across 86 test suites passed. Production builds and lint checks passed with verified manifest and update metadata.
