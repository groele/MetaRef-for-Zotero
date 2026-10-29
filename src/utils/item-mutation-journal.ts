export interface ItemFieldChange {
  field: string;
  before: unknown;
  after: unknown;
}

/** Record only writes made through one rule, leaving intervening external edits intact. */
export class ItemMutationJournal {
  private writes = new Map<string, { before: unknown; after: unknown }>();

  constructor(private item: Pick<Zotero.Item, "toJSON" | "fromJSON">) {}

  capture = (mutate: () => unknown) => {
    const before = this.item.toJSON() as Record<string, unknown>;
    try {
      return mutate();
    }
    finally {
      const after = this.item.toJSON() as Record<string, unknown>;
      for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) {
          const previous = this.writes.get(field);
          // A discontinuity belongs to an external writer, and becomes the rollback baseline.
          this.writes.set(field, { before: previous && JSON.stringify(before[field]) === JSON.stringify(previous.after) ? previous.before : before[field], after: after[field] });
        }
      }
    }
  };

  restore(): void {
    if (!this.writes.size)
      return;
    const current = this.item.toJSON() as Record<string, unknown>;
    const restored = { ...current };
    for (const [field, value] of this.writes) {
      if (JSON.stringify(current[field]) !== JSON.stringify(value.after))
        continue;
      if (value.before === undefined)
        delete restored[field];
      else
        restored[field] = value.before;
    }
    if (JSON.stringify(current) !== JSON.stringify(restored))
      this.item.fromJSON(restored, { strict: true });
  }

  changes(): ItemFieldChange[] {
    if (!this.writes.size)
      return [];
    const current = this.item.toJSON() as Record<string, unknown>;
    return [...this.writes].filter(([field, value]) => JSON.stringify(current[field]) === JSON.stringify(value.after)
      && JSON.stringify(value.before) !== JSON.stringify(value.after)).map(([field, value]) => ({ field, before: value.before ?? null, after: value.after ?? null }));
  }
}
