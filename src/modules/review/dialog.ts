import type { TagElementProps } from "zotero-plugin-toolkit";
import type { IdentifierCandidate, ReviewChange, ReviewProposal } from "./policy";
import { useDialog } from "../../utils/dialog";
import { getString } from "../../utils/locale";

export interface ReviewSelection {
  proposal: ReviewProposal;
  fields: Set<string>;
  acknowledged: boolean;
  action: "skip" | "update" | "related";
}

export function fieldLabel(field: string): string {
  if (field === "itemType" || field === "creators")
    return getString(`review-field-${field}`);
  if (!Zotero.ItemFields.getID(field))
    return field;
  return Zotero.ItemFields.getLocalizedString(field) || field;
}

export function displayValue(value: unknown): string {
  if (Array.isArray(value))
    return value.map(creator => creator.name || [creator.firstName, creator.lastName].filter(Boolean).join(" ")).join("; ");
  return String(value ?? "");
}

export function cell(text: string, header = false): TagElementProps {
  return { tag: header ? "th" : "td", properties: { textContent: text }, styles: { padding: "8px", textAlign: "start", verticalAlign: "top", borderBottom: "1px solid var(--fill-quinary)", whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: "360px" } };
}

export async function chooseIdentifier(item: Zotero.Item, candidates: IdentifierCandidate[], signal?: AbortSignal): Promise<IdentifierCandidate | undefined> {
  if (candidates.length === 1 && !candidates[0].excerpt)
    return candidates[0];
  const { dialog, openAndWaitClose } = useDialog(new ztoolkit.Dialog(1, 1), signal);
  let selected = -1;
  let accepted = false;
  dialog.addCell(0, 0, {
    tag: "div",
    styles: { maxWidth: "780px" },
    children: [
      { tag: "h3", properties: { textContent: item.getDisplayTitle() } },
      { tag: "p", properties: { textContent: getString("review-identifier-note") } },
      { tag: "select", attributes: { "aria-label": getString("review-identifier") }, properties: { id: "metaref-review-identifier", onchange: (event: Event) => { selected = Number((event.target as HTMLSelectElement).value); } }, children: [
        { tag: "option", properties: { value: "-1", textContent: getString("review-skip") } },
        ...candidates.map((candidate, index) => ({ tag: "option", properties: { value: String(index), textContent: `${candidate.kind}: ${candidate.value} · ${candidate.source}` } })),
      ] },
      ...candidates.map(candidate => ({ tag: "p", properties: { textContent: `${candidate.kind}: ${candidate.value}\n${candidate.source}\n${candidate.excerpt || ""}` }, styles: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } })),
    ],
  });
  dialog.addButton(getString("review-inspect"), "metaref-review-inspect", { callback: () => {
    accepted = true;
  } });
  dialog.addButton(getString("review-cancel"), "metaref-review-cancel");
  await openAndWaitClose(getString("review-identifier"));
  signal?.throwIfAborted();
  return accepted ? candidates[selected] : undefined;
}

export async function showMetadataReview(proposals: ReviewProposal[], errors: string[], version: boolean, signal?: AbortSignal, overwrite = false): Promise<ReviewSelection[] | false> {
  const selections: ReviewSelection[] = proposals.map(proposal => ({
    proposal,
    action: version || proposal.preprintURL ? "skip" : "update",
    acknowledged: false,
    fields: new Set(proposal.changes.filter(change => overwrite || version || proposal.preprintURL || !displayValue(change.before)).map(change => change.field)),
  }));
  let accepted = false;
  const { dialog, openAndWaitClose } = useDialog(new ztoolkit.Dialog(1, 1), signal);
  const rows = (selection: ReviewSelection) => selection.proposal.changes.map((change: ReviewChange) => ({
    tag: "tr",
    children: [
      { tag: "td", children: [{ tag: "input", attributes: { "type": "checkbox", "aria-label": fieldLabel(change.field) }, properties: { checked: selection.fields.has(change.field), disabled: selection.proposal.blocked, className: "metaref-review-field", value: change.field, onchange: (event: Event) => {
        if ((event.target as HTMLInputElement).checked)
          selection.fields.add(change.field);
        else
          selection.fields.delete(change.field);
      } } }] },
      cell(fieldLabel(change.field)),
      cell(displayValue(change.before)),
      cell(displayValue(change.after)),
    ],
  } satisfies TagElementProps));
  dialog.addCell(0, 0, {
    tag: "div",
    properties: { id: "metaref-metadata-review" },
    styles: { width: "min(950px, 78vw)", fontSize: "14px", color: "var(--fill-primary)" },
    children: [
      { tag: "p", properties: { textContent: getString(version ? "review-version-note" : "review-metadata-note") } },
      ...errors.map(error => ({ tag: "p", attributes: { role: "status" }, properties: { textContent: error }, styles: { whiteSpace: "pre-wrap" } })),
      ...selections.map(selection => ({
        tag: "section",
        properties: { className: "metaref-review-proposal" },
        styles: { marginBottom: "20px", border: "1px solid var(--fill-quinary)", padding: "12px", borderRadius: "8px" },
        children: [
          { tag: "h3", properties: { textContent: `${selection.proposal.itemID} · ${selection.proposal.original.title || ""}` } },
          { tag: "p", properties: { textContent: `${selection.proposal.identifier.kind}: ${selection.proposal.identifier.value}\n${selection.proposal.source}` }, styles: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } },
          ...selection.proposal.blocked ? [{ tag: "p", properties: { textContent: getString("review-blocked") } }] : [],
          ...selection.proposal.conflicts.length
            ? [{ tag: "label", children: [
                { tag: "input", attributes: { type: "checkbox" }, properties: { disabled: selection.proposal.blocked, className: "metaref-review-acknowledge", onchange: (event: Event) => { selection.acknowledged = (event.target as HTMLInputElement).checked; } } },
                { tag: "span", properties: { textContent: getString("review-conflict", { args: { fields: selection.proposal.conflicts.map(fieldLabel).join(", ") } }) } },
              ] }]
            : [],
          { tag: "label", children: [
            { tag: "span", properties: { textContent: getString("review-action") } },
            { tag: "select", properties: { className: "metaref-review-action", disabled: selection.proposal.blocked, value: selection.action, onchange: (event: Event) => { selection.action = (event.target as HTMLSelectElement).value as ReviewSelection["action"]; } }, children: [
              { tag: "option", properties: { value: "skip", textContent: getString("review-skip"), selected: selection.action === "skip" } },
              { tag: "option", properties: { value: "update", textContent: getString("review-update"), selected: selection.action === "update" } },
              ...selection.proposal.preprintURL ? [{ tag: "option", properties: { value: "related", textContent: getString("review-create-related") } }] : [],
            ] },
          ] },
          { tag: "table", styles: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }, children: [
            { tag: "thead", children: [{ tag: "tr", children: [cell(getString("review-adopt"), true), cell(getString("review-field"), true), cell(getString("review-before"), true), cell(getString("review-after"), true)] }] },
            { tag: "tbody", children: rows(selection) },
          ] },
          ...selection.proposal.changes.length ? [] : [{ tag: "p", properties: { textContent: getString("review-unchanged") } }],
          ...selection.proposal.preprintURL ? [{ tag: "p", properties: { textContent: getString("review-version-note") } }] : [],
        ],
      } satisfies TagElementProps)),
    ],
  });
  dialog.addButton(getString("review-apply"), "metaref-review-apply", { callback: () => {
    accepted = true;
  } });
  dialog.addButton(getString("review-cancel"), "metaref-review-cancel");
  await openAndWaitClose(getString(version ? "rule-tool-review-preprint" : "rule-tool-review-metadata"));
  signal?.throwIfAborted();
  return accepted ? selections : false;
}
