import { assert } from "chai";
import { config } from "../../package.json";

describe("startup", function () {
  it("uses the requested host platform", function () {
    const expectedPlatform = Zotero.Prefs.get("metaref.test.expectedPlatform", true);
    if (expectedPlatform)
      assert.equal(Zotero.platformMajorVersion, expectedPlatform);
    assert.isAtLeast(Zotero.platformMajorVersion, 140);
  });

  it("should have plugin instance defined", function () {
    // @ts-expect-error no types
    assert.isObject(Zotero[config.addonInstance]);
    // assert.property(Zotero, config.addonRef);
  });
});
