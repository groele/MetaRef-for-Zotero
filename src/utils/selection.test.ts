import { describe, expect, it } from "vitest";
import { selectedCollections, selectedLibraryIDs } from "./selection";

function removed(): never {
  throw new Error("removed");
}

describe("host selection compatibility", () => {
  it("uses the plural API without calling a removed singular stub", () => {
    expect(selectedLibraryIDs({ getSelectedLibraryIDs: () => [1, 2, 1], getSelectedLibraryID: removed })).toEqual([1, 2]);
  });
  it("supports an older host's singular library API", () => {
    expect(selectedLibraryIDs({ getSelectedLibraryID: () => 3 })).toEqual([3]);
  });
  it("does not call a removed stub when the current selection is empty", () => {
    expect(selectedLibraryIDs({ getSelectedLibraryIDs: () => [], getSelectedLibraryID: removed })).toEqual([]);
    expect(selectedLibraryIDs()).toEqual([]);
  });
  it("retains all selected collections from the plural API", () => {
    const collections = [{ id: 1 }, { id: 2 }] as Zotero.Collection[];
    expect(selectedCollections({ getSelectedCollections: () => collections, getSelectedCollection: removed })).toEqual(collections);
  });
  it("supports older collection selection and no active pane", () => {
    const collection = { id: 1 } as Zotero.Collection;
    expect(selectedCollections({ getSelectedCollection: () => collection })).toEqual([collection]);
    expect(selectedCollections({ getSelectedCollection: () => false })).toEqual([]);
    expect(selectedCollections()).toEqual([]);
  });
});
