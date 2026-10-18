import { expect, it } from "vitest";
import { workflowGroup } from "./workflow-settings";

it("assigns each formatter to a single workflow module", () => {
  expect(workflowGroup("correct-title-sentence-case")).toBe("title");
  expect(workflowGroup("correct-bookTitle-sentence-case")).toBe("title");
  expect(workflowGroup("correct-proceedingsTitle-sentence-case")).toBe("title");
  expect(workflowGroup("correct-publication-title-case")).toBe("publication");
  expect(workflowGroup("correct-creators-case")).toBe("creators");
  expect(workflowGroup("require-doi")).toBe("identifiers");
  expect(workflowGroup("correct-pages-range")).toBe("pagination");
  expect(workflowGroup("correct-date-format")).toBe("other");
});
