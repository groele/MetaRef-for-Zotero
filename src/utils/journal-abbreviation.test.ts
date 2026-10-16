import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AbbrevIso } from "../vendor/abbrev-iso";
import { buildJournalMaps, lookupJournalAbbreviation, styleJournalAbbreviation } from "./journal-abbreviation";

describe("journal abbreviation sources and identity", () => {
  it("preserves punctuation identities and refuses ambiguous relaxed matches", () => {
    const maps = buildJournalMaps({ "A-B Journal": "AB. J.", "A B Journal": "A. B. J." });
    expect(lookupJournalAbbreviation(" A-B JOURNAL ", maps).abbr).toBe("AB. J.");
    expect(lookupJournalAbbreviation("A:B Journal", maps)).toEqual({});
    expect(lookupJournalAbbreviation("A:B Journal", maps, true).ambiguous).toBe(true);
    expect(lookupJournalAbbreviation("A B Journal", maps, true).abbr).toBe("A. B. J.");
  });

  it("does not silently pick conflicting case-equivalent full names", () => {
    const maps = buildJournalMaps({ Nature: "Nature", NATURE: "Nat." });
    expect(lookupJournalAbbreviation("nature", maps).ambiguous).toBe(true);
  });

  it("loads the generated JabRef mapping and source profiles", () => {
    const data = JSON.parse(readFileSync("data/journal-abbr/journal-abbr.json", "utf8"));
    const profiles = JSON.parse(readFileSync("data/journal-abbr/journal-abbr-profiles.json", "utf8"));
    expect(Object.keys(data)).toHaveLength(44304);
    expect(Object.keys(profiles)).toHaveLength(18);
    const maps = buildJournalMaps(data);
    expect(lookupJournalAbbreviation("Nano Research", maps).abbr).toBe("Nano Res.");
    expect(lookupJournalAbbreviation("Physical Review Letters", maps).abbr).toBe("Phys. Rev. Lett.");
    expect(lookupJournalAbbreviation("Nanoscale", maps).abbr).toBe("Nanoscale");
    expect(lookupJournalAbbreviation("Nature", maps).abbr).toBe("Nature");
  });

  it("runs ISO 4 inference using only the packaged LTWA and short words", () => {
    const engine = new AbbrevIso(readFileSync("data/journal-abbr/ltwa.tsv", "utf8"), readFileSync("data/journal-abbr/shortwords.txt", "utf8"));
    expect(engine.makeAbbreviation("Journal of Experimental Biology")).toBe("J. Exp. Biol.");
    expect(engine.makeAbbreviation("Physical Review Letters")).toBe("Phys. Rev. Lett.");
  });

  it("applies explicitly selected letter styles", () => {
    expect(styleJournalAbbreviation("J. Biol. Chem.")).toBe("J. Biol. Chem.");
    expect(styleJournalAbbreviation("J. Biol. Chem.", "upper")).toBe("J. BIOL. CHEM.");
    expect(styleJournalAbbreviation("J. Biol. Chem.", "lower")).toBe("j. biol. chem.");
    expect(styleJournalAbbreviation("J. BIOL. CHEM.", "title")).toBe("J. Biol. Chem.");
    expect(styleJournalAbbreviation("J. Biol. Chem.", "initials")).toBe("JBC");
  });
});
