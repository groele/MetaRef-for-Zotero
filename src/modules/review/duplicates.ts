import type { TransformedData } from "../rules/tool-update-metadata/services/base-service";
import type { MasterStrategy } from "./duplicate-policy";
import type { DuplicatePair, DuplicateRecord } from "./policy";
import { useDialog } from "../../utils/dialog";
import { getString } from "../../utils/locale";
import { getPref } from "../../utils/prefs";
import { isFieldValidForItemType } from "../../utils/zotero";
import { extractIdentifiers, isPreprint } from "../rules/tool-update-metadata/identifiers";
import { assertReviewFresh } from "./apply";
import { cell, displayValue, fieldLabel } from "./dialog";
import { canMergePair, chooseMaster } from "./duplicate-policy";
import { isNonDuplicate, markNonDuplicate, transferNonDuplicates } from "./non-duplicates";
import { duplicatePairs, REVIEW_FIELDS } from "./policy";

export interface DuplicateDecision {
  pair: DuplicatePair;
  action: "skip" | "merge" | "relate" | "notDuplicate";
  masterID: number;
  donors: Map<string, number>;
}

export function duplicateRecord(item: Zotero.Item): DuplicateRecord {
  return { id: item.id, libraryID: item.libraryID, data: JSON.parse(JSON.stringify(item.toJSON())) as TransformedData, preprint: isPreprint(item, extractIdentifiers(item)) };
}

export async function findDuplicates(items: Zotero.Item[], signal?: AbortSignal): Promise<DuplicatePair[]> {
  const records: DuplicateRecord[] = [];
  for (const libraryID of new Set(items.map(item => item.libraryID))) {
    signal?.throwIfAborted();
    const library = await Zotero.Items.getAll(libraryID, true, false);
    for (let index = 0; index < library.length; index++) {
      const item = library[index];
      if (item.isRegularItem() && !item.deleted) {
        const creator = item.getCreators()[0];
        records.push({
          id: item.id,
          libraryID: item.libraryID,
          preprint: isPreprint(item, extractIdentifiers(item)),
          data: { itemType: item.itemType, DOI: String(item.getField("DOI") || ""), title: String(item.getField("title") || ""), date: String(item.getField("date") || ""), url: String(item.getField("url") || ""), creators: creator ? [{ creatorType: "author", ...creator.fieldMode === 1 ? { name: creator.lastName } : { lastName: creator.lastName, firstName: creator.firstName } }] : [] },
        });
      }
      if (index % 250 === 0) {
        await Zotero.Promise.delay(0);
        signal?.throwIfAborted();
      }
    }
  }
  const snapshots = new Map<number, DuplicateRecord>();
  const snapshot = (id: number) => {
    if (!snapshots.has(id))
      snapshots.set(id, duplicateRecord(Zotero.Items.get(id) as Zotero.Item));
    return snapshots.get(id)!;
  };
  return duplicatePairs(new Set(items.map(item => item.id)), records)
    .filter(pair => !isNonDuplicate(Zotero.Items.get(pair.left.id) as Zotero.Item, Zotero.Items.get(pair.right.id) as Zotero.Item))
    .map(pair => ({ ...pair, left: snapshot(pair.left.id), right: snapshot(pair.right.id) }));
}

export async function reviewDuplicate(pair: DuplicatePair, signal?: AbortSignal): Promise<DuplicateDecision | false> {
  const mergeable = canMergePair(pair, getPref("duplicates.mergeDifferentTypes" as any, false) === true);
  const master = chooseMaster([pair.left, pair.right], getPref("duplicates.masterStrategy" as any, "oldest") as MasterStrategy);
  const decision: DuplicateDecision = { pair, action: "skip", masterID: master.id, donors: new Map() };
  let accepted = false;
  const { dialog, openAndWaitClose } = useDialog(new ztoolkit.Dialog(1, 1), signal);
  const details = (record: DuplicateRecord) => {
    const item = Zotero.Items.get(record.id);
    if (!item)
      throw new Error(getString("review-stale"));
    return `${record.id} · ${record.data.title || ""}\n${getString("review-item-summary", { args: { attachments: item.getAttachments().length, notes: item.getNotes().length, tags: item.getTags().length, collections: item.getCollections().length } })}`;
  };
  dialog.addCell(0, 0, {
    tag: "div",
    properties: { id: "metaref-duplicate-review" },
    styles: { width: "min(950px, 78vw)", fontSize: "14px" },
    children: [
      { tag: "p", properties: { textContent: getString(`review-duplicate-${pair.reason}`) } },
      { tag: "p", properties: { textContent: getString(mergeable ? "review-merge-note" : "review-relate-note") } },
      { tag: "label", children: [
        { tag: "span", properties: { textContent: getString("review-action") } },
        { tag: "select", properties: { id: "metaref-duplicate-action", onchange: (event: Event) => { decision.action = (event.target as HTMLSelectElement).value as DuplicateDecision["action"]; } }, children: [
          { tag: "option", properties: { value: "skip", textContent: getString("review-skip") } },
          { tag: "option", properties: { value: "relate", textContent: getString("review-relate") } },
          { tag: "option", properties: { value: "notDuplicate", textContent: getString("duplicates-mark-not") } },
          ...mergeable ? [{ tag: "option", properties: { value: "merge", textContent: getString("review-merge") } }] : [],
        ] },
      ] },
      { tag: "label", children: [
        { tag: "span", properties: { textContent: getString("review-master") } },
        { tag: "select", properties: { id: "metaref-duplicate-master", onchange: (event: Event) => { decision.masterID = Number((event.target as HTMLSelectElement).value); } }, children: [pair.left, pair.right].map(record => ({ tag: "option", properties: { value: String(record.id), selected: record.id === master.id, textContent: `${record.id} · ${record.data.title || ""}` } })) },
      ] },
      { tag: "table", styles: { width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }, children: [
        { tag: "thead", children: [{ tag: "tr", children: [cell(getString("review-field"), true), cell(details(pair.left), true), cell(details(pair.right), true), cell(getString("review-adopt"), true)] }] },
        { tag: "tbody", children: ["itemType", ...REVIEW_FIELDS, "extra"].filter(field => pair.left.data[field as keyof typeof pair.left.data] || pair.right.data[field as keyof typeof pair.right.data]).map((field) => {
          const left = pair.left.data[field as keyof typeof pair.left.data];
          const right = pair.right.data[field as keyof typeof pair.right.data];
          const different = JSON.stringify(left ?? "") !== JSON.stringify(right ?? "");
          return { tag: "tr", children: [cell(fieldLabel(field)), cell(displayValue(left)), cell(displayValue(right)), {
            tag: "td",
            children: mergeable && field !== "itemType" && different
              ? [{ tag: "select", attributes: { "aria-label": fieldLabel(field) }, properties: { className: "metaref-duplicate-field", value: "0", onchange: (event: Event) => {
                  const donor = Number((event.target as HTMLSelectElement).value);
                  if (donor)
                    decision.donors.set(field, donor);
                  else
                    decision.donors.delete(field);
                } }, children: [
                  { tag: "option", properties: { value: "0", textContent: getString("review-keep-master") } },
                  ...[pair.left, pair.right].map(record => ({ tag: "option", properties: { value: String(record.id), textContent: String(record.id) } })),
                ] }]
              : [],
          }] };
        }) },
      ] },
    ],
  });
  dialog.addButton(getString("review-apply"), "metaref-duplicate-apply", { callback: () => {
    accepted = true;
  } });
  dialog.addButton(getString("review-cancel"), "metaref-review-cancel");
  await openAndWaitClose(getString("rule-tool-review-duplicates"));
  signal?.throwIfAborted();
  return accepted ? decision : false;
}

export async function applyDuplicateDecision(decision: DuplicateDecision, signal?: AbortSignal): Promise<"merged" | "related" | "skipped" | "excluded"> {
  if (decision.action === "skip")
    return "skipped";
  const { pair } = decision;
  const left = Zotero.Items.get(pair.left.id);
  const right = Zotero.Items.get(pair.right.id);
  if (!left || !right || left.libraryID !== right.libraryID || left.hasChanged() || right.hasChanged())
    throw new Error(getString("review-stale"));
  assertReviewFresh(left, pair.left.data);
  assertReviewFresh(right, pair.right.data);
  if (decision.action === "notDuplicate") {
    markNonDuplicate(left, right);
    return "excluded";
  }
  if (decision.action === "merge") {
    const current = duplicatePairs(new Set([left.id]), [duplicateRecord(left), duplicateRecord(right)])[0];
    if (!current || !canMergePair(current, getPref("duplicates.mergeDifferentTypes" as any, false) === true) || isNonDuplicate(left, right) || ![left.id, right.id].includes(decision.masterID))
      throw new Error(getString("review-relate-note"));
  }
  const master = decision.masterID === right.id ? right : left;
  const other = master === left ? right : left;
  // Include children in failure recovery; the host merge owns their movement and key remapping.
  const children = await Zotero.Items.getAsync([...left.getAttachments(true), ...right.getAttachments(true), ...left.getNotes(true), ...right.getNotes(true)]);
  if (children.some(item => item.hasChanged()))
    throw new Error(getString("review-stale"));
  signal?.throwIfAborted();
  assertReviewFresh(left, pair.left.data);
  assertReviewFresh(right, pair.right.data);
  try {
    if (decision.action === "relate") {
      await Zotero.DB.executeTransaction(async () => {
        signal?.throwIfAborted();
        left.addRelatedItem(right);
        right.addRelatedItem(left);
        await left.save();
        await right.save();
      });
    }
    else {
      if (left.itemType !== right.itemType) {
        const types = [left.itemType, right.itemType].filter(type => [left, right].every(item => item.getCreators().every(creator => Zotero.CreatorTypes.isValidForItemType(creator.creatorTypeID, Number(Zotero.ItemTypes.getID(type))))));
        const loss = (type: typeof left.itemType) => [left, right].reduce((total, item) => total + Object.entries(item.toJSON()).filter(([field, value]) => typeof value === "string" && value && Zotero.ItemFields.getID(field) && !isFieldValidForItemType(field as any, type)).length, 0);
        const target = types.sort((a, b) => loss(a) - loss(b))[0];
        if (!target)
          throw new Error(getString("rule-tool-update-metadata-invalid-creators"));
        let preserved = String(master.getField("extra") || "");
        for (const item of [left, right]) {
          for (const [field, value] of Object.entries(item.toJSON())) {
            if (typeof value === "string" && value && Zotero.ItemFields.getID(field) && !isFieldValidForItemType(field as any, target))
              preserved += `\nMetaFlow preserved ${item.key} ${field}: ${JSON.stringify(value)}`;
          }
          item.setType(Number(Zotero.ItemTypes.getID(target)));
        }
        master.setField("extra", preserved.trim());
      }
      for (const [field, value] of Object.entries(other.toJSON())) {
        if (field !== "extra" && typeof value === "string" && value && Zotero.ItemFields.getID(field) && isFieldValidForItemType(field as any, master.itemType) && !master.getField(field))
          master.setField(field, value);
      }
      if (!master.getCreators().length && other.getCreators().length)
        master.setCreators(other.getCreators());
      if (!decision.donors.has("extra")) {
        const lines = [master.getField("extra"), other.getField("extra")].flatMap(value => String(value || "").split(/\r?\n/)).filter(Boolean);
        master.setField("extra", [...new Set(lines)].join("\n"));
      }
      for (const [field, donorID] of decision.donors) {
        if (![...REVIEW_FIELDS, "extra"].includes(field as any) || ![left.id, right.id].includes(donorID))
          throw new Error(getString("review-blocked"));
        const donor = donorID === left.id ? pair.left.data : pair.right.data;
        if (field === "creators")
          master.setCreators(donor.creators || []);
        else if (isFieldValidForItemType(field as any, master.itemType))
          master.setField(field, donor[field as keyof typeof donor] as string || "");
      }
      // The native merge opens its own transaction; wrapping it queues a transaction against itself.
      await Zotero.Items.merge(master, [other]);
      transferNonDuplicates(master, other);
    }
  }
  catch (error) {
    for (const item of [left, right, ...children])
      await item.reload(["primaryData", "itemData", "creators", "relations", "tags", "collections", "childItems"], true);
    throw error;
  }
  return decision.action === "merge" ? "merged" : "related";
}
