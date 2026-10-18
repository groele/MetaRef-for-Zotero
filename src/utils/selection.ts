export interface SelectionPane {
  getSelectedLibraryIDs?: () => number[];
  getSelectedLibraryID?: () => number | undefined;
  getSelectedCollections?: () => Zotero.Collection[];
  getSelectedCollection?: () => Zotero.Collection | false | undefined;
}

export function selectedLibraryIDs(pane?: SelectionPane | null): number[] {
  const ids = pane?.getSelectedLibraryIDs ? pane.getSelectedLibraryIDs() : [pane?.getSelectedLibraryID?.()];
  return [...new Set(ids.filter((id): id is number => Number.isSafeInteger(id) && Number(id) > 0))];
}

export function selectedCollections(pane?: SelectionPane | null): Zotero.Collection[] {
  if (pane?.getSelectedCollections)
    return pane.getSelectedCollections();
  const collection = pane?.getSelectedCollection?.();
  return collection ? [collection] : [];
}
