#!/usr/bin/env python3
"""Build reproducible JabRef mappings; retain exact titles and audit source conflicts."""
import csv
import hashlib
import json
import subprocess
from pathlib import Path

BASE = Path(__file__).parent
JABREF = BASE / "abbrv.jabref.org"
PRIORITY = ["ieee", "acs", "ubc", "ams", "general", "geology_physics", "lifescience", "mathematics", "mechanical", "meteorology", "sociology"]

def rows(path):
    with path.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.reader(line for line in stream if line.strip() and not line.lstrip().startswith("#")):
            if len(row) < 2:
                continue
            title, abbr = row[0].strip(), row[1].strip()
            if title and abbr and not any(ord(c) < 32 for c in title + abbr):
                yield title, abbr

def main():
    files = sorted((JABREF / "journals").glob("*.csv"))
    if not files:
        raise RuntimeError("Initialize the JabRef submodule before generating data")
    preferred = [JABREF / "journals" / f"journal_abbreviations_{name}.csv" for name in PRIORITY]
    files = [BASE / "override.csv"] + [p for p in preferred if p.exists()] + [p for p in files if p not in preferred and not p.stem.endswith("_strings")]
    combined, chosen, conflicts, profiles, sources, identities = {}, {}, [], {}, [], {}
    for path in files:
        entries = list(rows(path))
        if path.parent == JABREF / "journals":
            profiles[path.stem.removeprefix("journal_abbreviations_")] = dict(entries)
        sources.append({"file": str(path.relative_to(BASE)).replace("\\", "/"), "rows": len(entries), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        for title, abbr in entries:
            identity = " ".join(title.lower().split())
            title = identities.setdefault(identity, title)
            if title in combined and combined[title] != abbr:
                conflicts.append({"title": title, "selected": combined[title], "alternative": abbr, "selectedSource": chosen[title], "source": path.name})
            elif title not in combined:
                combined[title] = abbr
                chosen[title] = path.name
    revision = subprocess.check_output(["git", "-C", str(JABREF), "rev-parse", "HEAD"], text=True).strip()
    def save(name, data):
        (BASE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    save("journal-abbr.json", combined)
    save("journal-abbr-profiles.json", profiles)
    save("journal-abbr-provenance.json", {"repository": "https://github.com/JabRef/abbrv.jabref.org", "revision": revision, "entries": len(combined), "sources": sources, "conflicts": conflicts})
    print(f"JabRef {revision}: {len(combined)} exact titles, {len(profiles)} profiles, {len(conflicts)} source differences")

if __name__ == "__main__":
    main()
