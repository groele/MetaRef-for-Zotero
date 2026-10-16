export async function showZoteroDirectory(kind: "data" | "profile") {
  const path = kind === "data" ? Zotero.DataDirectory.dir : (Zotero as any).Profile.dir;
  await Zotero.File.reveal(path);
}
