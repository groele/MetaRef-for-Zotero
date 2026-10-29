import { describe, expect, it, vi } from "vitest";
import * as http from "../../../utils/http";
import { fetchISSNFromCrossref, fetchISSNFromOpenAlex, normalizeISSN, resolveMissingISSN } from "./issn-resolver";

describe("issn-resolver", () => {
  describe("normalizeISSN", () => {
    it("normalizes unhyphenated 8-digit ISSN", () => {
      expect(normalizeISSN("13596454")).toBe("1359-6454");
    });

    it("keeps already hyphenated valid ISSN", () => {
      expect(normalizeISSN("1359-6454")).toBe("1359-6454");
    });

    it("uppercases check character X", () => {
      expect(normalizeISSN("1234567x")).toBe("1234-567X");
      expect(normalizeISSN("1234-567x")).toBe("1234-567X");
    });

    it("handles surrounding whitespaces", () => {
      expect(normalizeISSN("  1359-6454  ")).toBe("1359-6454");
    });

    it("returns undefined for invalid ISSN values", () => {
      expect(normalizeISSN("")).toBeUndefined();
      expect(normalizeISSN(undefined)).toBeUndefined();
      expect(normalizeISSN(12345678 as any)).toBeUndefined();
      expect(normalizeISSN("1234")).toBeUndefined();
      expect(normalizeISSN("123456789")).toBeUndefined();
      expect(normalizeISSN("not-an-issn")).toBeUndefined();
    });
  });

  describe("aPI resolvers", () => {
    it("fetches ISSN from OpenAlex via DOI", async () => {
      vi.spyOn(http, "requestCachedGET").mockResolvedValueOnce({
        status: 200,
        response: JSON.stringify({
          primary_location: {
            source: {
              issn_l: "1359-6454",
              issn: ["1359-6454", "1873-2453"],
            },
          },
        }),
      } as any);

      const issn = await fetchISSNFromOpenAlex({ doi: "10.1016/j.actamat.2023.118944" });
      expect(issn).toBe("1359-6454");
    });

    it("fetches ISSN from OpenAlex via publicationTitle when DOI is absent", async () => {
      vi.spyOn(http, "requestCachedGET").mockResolvedValueOnce({
        status: 200,
        response: JSON.stringify({
          results: [
            {
              issn_l: "0028-0836",
              issn: ["0028-0836", "1476-4687"],
            },
          ],
        }),
      } as any);

      const issn = await fetchISSNFromOpenAlex({ publicationTitle: "Nature" });
      expect(issn).toBe("0028-0836");
    });

    it("fetches ISSN from Crossref via DOI", async () => {
      vi.spyOn(http, "requestCachedGET").mockResolvedValueOnce({
        status: 200,
        response: JSON.stringify({
          message: {
            ISSN: ["1359-6454"],
          },
        }),
      } as any);

      const issn = await fetchISSNFromCrossref({ doi: "10.1016/j.actamat.2023.118944" });
      expect(issn).toBe("1359-6454");
    });

    it("resolves missing ISSN prioritizing OpenAlex and falling back to Crossref", async () => {
      // 1. OpenAlex returns match
      vi.spyOn(http, "requestCachedGET").mockResolvedValueOnce({
        status: 200,
        response: JSON.stringify({
          primary_location: {
            source: { issn_l: "1359-6454" },
          },
        }),
      } as any);

      const res1 = await resolveMissingISSN({ doi: "10.1016/j.actamat.2023.118944" });
      expect(res1).toEqual({ issn: "1359-6454", source: "OpenAlex" });

      // 2. OpenAlex fails, Crossref succeeds
      vi.spyOn(http, "requestCachedGET")
        .mockRejectedValueOnce(new Error("OpenAlex timeout"))
        .mockResolvedValueOnce({
          status: 200,
          response: JSON.stringify({
            message: {
              ISSN: ["0028-0836"],
            },
          }),
        } as any);

      const res2 = await resolveMissingISSN({ doi: "10.1038/nature12345" });
      expect(res2).toEqual({ issn: "0028-0836", source: "Crossref" });
    });
  });
});
