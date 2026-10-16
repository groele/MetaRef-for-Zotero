import type { MetadataService } from "./base-service";
import { ArxivService } from "./arxiv-service";
import { CnkiTitleService } from "./cnki-title-service";
import { SemanticScholarService } from "./semantic-scholar-service";
import { IdentifiersTranslateService, ItemTranslateService, URLTranslateService } from "./translate-service";

export const services: MetadataService<any>[] = [
  // Keep preprint service first
  ArxivService,

  // Then Zotero's translate service
  IdentifiersTranslateService,
  CnkiTitleService,
  ItemTranslateService,

  // Then, Semantic Scholar
  SemanticScholarService,

  // Finally, URL translate service
  URLTranslateService,
];
