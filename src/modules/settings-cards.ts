/** Keep every settings section on the same native, collapsible card layout. */
export function setupFunctionCards(pane: Element) {
  const doc = pane.ownerDocument!;
  for (const group of [...pane.querySelectorAll<HTMLElement>("groupbox")].reverse()) {
    if (group.parentElement?.matches("details.metaref-setting-card"))
      continue;
    const heading = group.querySelector(":scope > label");
    if (!heading)
      continue;
    const top = group.parentElement === pane;
    const card = doc.createElementNS("http://www.w3.org/1999/xhtml", "details") as HTMLDetailsElement;
    card.className = `metaref-setting-card${top ? " metaref-section-card" : ""}`;
    card.open = top && Boolean(heading.querySelector("[data-l10n-id$='section-general'], [data-l10n-id$='section-rules']"));
    const summary = doc.createElementNS("http://www.w3.org/1999/xhtml", "summary");
    summary.append(heading);
    group.before(card);
    card.append(summary, group);
  }
  for (const detail of pane.querySelectorAll("details.metaref-pref-collapsible, details.metaref-setting-card")) {
    detail.classList.add("metaref-setting-card");
    if (detail.querySelector(":scope > groupbox, :scope > .metaref-card-body"))
      continue;
    const body = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
    body.className = "metaref-card-body";
    body.append(...[...detail.children].filter(child => child.localName !== "summary"));
    detail.append(body);
  }
  for (const parent of pane.querySelectorAll("groupbox, .indented-pref")) {
    const runs: Element[][] = [];
    for (const child of [...parent.children]) {
      if (!child.matches(".metaref-check-option"))
        continue;
      const previous = child.previousElementSibling;
      if (previous && runs.at(-1)?.includes(previous))
        runs.at(-1)!.push(child);
      else
        runs.push([child]);
    }
    for (const run of runs.filter(run => run.length > 1)) {
      const grid = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      grid.className = "metaref-choice-grid";
      run[0].before(grid);
      grid.append(...run);
    }
  }
  const sections = [...pane.querySelectorAll(":scope > .metaref-section-card")];
  for (const id of ["section-general", "core-workflows-heading", "section-rules", "section-article-abbreviation", "section-updateMetadata", "duplicates-heading", "workflow-tool-center", "section-menu", "shortcuts-header", "section-rich-text", "section-about"]) {
    const section = sections.find(section => section.querySelector(`:scope > summary [data-l10n-id$='${id}']`));
    if (section)
      pane.append(section);
  }
}
