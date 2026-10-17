import { DataLoader } from "../../utils/data-loader";
import { watchItemFields } from "../../utils/field-conflicts";
import { defineRule } from "./rule-base";

export const RequireUniversityPlace = defineRule({
  id: "require-university-place",
  scope: "field",

  targetItemTypes: ["thesis"],
  targetItemField: "place",
  fieldMenu: {
    l10nID: "rule-require-university-place-menu-field",
  },
  async apply({ item, debug, report }) {
    const university = item.getField("university") as string;
    if (!university)
      return;

    const unchanged = watchItemFields(item, ["university", "place"], report);
    const data = await DataLoader.load("universityPlace");
    if (!unchanged())
      return;
    const place = data[university] || data[university.replace(/[（(].*[)）]/, "")];

    const currentPlace = item.getField("place") as string;
    if (!place && currentPlace)
      debug(`${university} not existed in dataset, and original place not empty, skip it.`);
    else if (place && place !== currentPlace)
      item.setField("place", place);
  },
});
