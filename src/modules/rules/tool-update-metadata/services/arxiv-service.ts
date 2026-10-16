import { requestGET } from "../../../../utils/http";
import { defineService } from "./base-service";

export const ArxivService = defineService({
  id: "arxiv-service",
  name: "ArXiv Service",
  cooldown: 3_000,
  shouldApply: ({ identifiers }) => {
    return !!identifiers.arXiv;
  },
  async updateIdentifiers({ identifiers, debug, signal }) {
    if (!identifiers.arXiv) {
      return false;
    }

    const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(identifiers.arXiv)}`;

    const res = await requestGET(url, {}, signal);
    const result = res.response as string;
    if (!result) {
      debug("Failed to get DOI from arXiv");
      return false;
    }

    const doc = new (Zotero.getMainWindow() as unknown as Window & typeof globalThis).DOMParser().parseFromString(result, "text/xml");
    const refDoi = doc.querySelector("doi");
    if (!refDoi) {
      debug("ArXiv did not return DOI");
      return false;
    }

    debug("Got DOI from Arxiv", refDoi);
    const doi = Zotero.Utilities.cleanDOI(refDoi.textContent?.trim() || "");
    if (!doi)
      return false;
    identifiers.DOI = doi;
    return true;
  },
});
