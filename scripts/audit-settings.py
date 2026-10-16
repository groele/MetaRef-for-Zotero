"""Inventory default preferences, visible bindings and runtime dispatch references.

This is a static integrity check. Live setting persistence and behavior are verified
separately by the Zotero integration tests; source references alone are not proof.
"""

import argparse
import collections
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET


def audit(root: Path):
    defaults = {
        key: json.loads(value)
        for key, value in re.findall(
            r'pref\("([^"]+)",\s*(.*?)\);',
            (root / "addon/prefs.js").read_text(encoding="utf-8"),
        )
    }
    fragment = (root / "addon/content/preferences.xhtml").read_text(encoding="utf-8")
    tree = ET.fromstring('<audit xmlns:html="http://www.w3.org/1999/xhtml">' + fragment + "</audit>")
    controls = [
        {"key": node.attrib["preference"], "element": node.tag.rsplit("}", 1)[-1],
         "label": node.attrib.get("data-l10n-id"), "type": node.attrib.get("type")}
        for node in tree.iter() if "preference" in node.attrib
    ]
    registered = set(re.findall(r'"([^"]+)"', (root / "typings/rules.d.ts").read_text(encoding="utf-8")))
    readers = collections.defaultdict(list)
    for path in sorted((root / "src").rglob("*.ts")):
        if path.name.endswith(".test.ts") or path.name == "prefs.ts":
            continue
        text = path.read_text(encoding="utf-8")
        for match in re.finditer(r'getPref\(\s*(["\'`])(.*?)\1', text):
            readers[match[2]].append(f"{path.relative_to(root).as_posix()}:{text[:match.start()].count(chr(10)) + 1}")

    def route(key):
        if key in readers:
            return {"kind": "direct", "references": readers[key]}
        for prefix, reference in [
            ("easyscholar.fields.", "src/modules/rules/tool-update-easyscholar.ts"),
            ("easyscholar.columns.", "src/modules/item-tree.ts"),
            ("menu.", "src/modules/menu.ts"),
            ("shortcut.", "src/modules/shortcuts.ts"),
        ]:
            if key.startswith(prefix):
                return {"kind": "dynamic-family", "references": [reference]}
        if key.startswith("rule.") and key[5:] in registered:
            return {"kind": "rule-registry", "references": ["src/modules/rules/index.ts"]}
        if key in {"insights.esiSourcePriority", "insights.natureSourcePriority"}:
            return {"kind": "dynamic-source-priority", "references": ["src/utils/journal-insights.ts"]}
        if key.startswith("integration."):
            return {"kind": "internal-migration-state", "references": ["src/utils/greenfrog-migration.ts"]}
        if key in {"cleanExtra", "rule.tool-update-metadata.option.slient"}:
            return {"kind": "legacy-hidden", "references": []}
        return {"kind": "review-required", "references": []}

    counts = collections.Counter(control["key"] for control in controls)
    missing = sorted(set(counts) - defaults.keys())
    duplicates = sorted(key for key, count in counts.items() if count > 1)
    visible_unresolved = sorted(key for key in counts if route(key)["kind"] == "review-required")
    return {
        "scope": "Static source integrity only; excludes real provider availability and permissions.",
        "defaultCount": len(defaults), "staticControlCount": len(controls),
        "missingDefaults": missing, "duplicateStaticBindings": duplicates,
        "unresolvedVisibleBindings": visible_unresolved,
        "generatedControls": {
            "implementation": "src/modules/preference.ts and src/modules/workflow-settings.ts",
            "verification": "Live settings tests click generated fields, columns, menu and workflow controls.",
        },
        "preferences": [
            {"key": key, "default": value, "staticControls": [c for c in controls if c["key"] == key],
             "runtime": route(key)}
            for key, value in sorted(defaults.items())
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = audit(Path(__file__).resolve().parent.parent)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k not in {"preferences", "generatedControls"}}, ensure_ascii=False))
    if result["missingDefaults"] or result["duplicateStaticBindings"] or result["unresolvedVisibleBindings"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
