import type { JournalInsights } from "./journal-insights";
import { formatESICategories } from "./esi";
import { getString } from "./locale";

export function presentJournalInsights(result: JournalInsights, locale: string) {
  const basis = (value?: JournalInsights["esiBasis"]) => value
    ? getString("journal-insights-match-detail", { args: { basis: getString(`journal-insights-basis-${value}`) } })
    : "";
  return [
    {
      label: getString("field-esi"),
      matched: !result.esiError && result.categories.length > 0,
      value: result.esiError
        ? getString("journal-insights-unavailable")
        : formatESICategories(result.categories, locale.startsWith("zh") ? "{subject}" : "{en}") || getString("journal-insights-unmatched"),
      basis: result.esiError ? "" : basis(result.esiBasis),
      source: result.esiSource === "api" ? getString("journal-insights-api-source") : getString(result.esiSource === "custom" ? "journal-insights-esi-custom" : "journal-insights-esi-builtin"),
      warning: (result.esiError === "journal-insights-api-missing" ? getString("journal-insights-api-missing") : result.esiError) || (result.esiAPIWarning ? getString("journal-insights-api-fallback") : "") || (result.customFallback ? `${getString("journal-insights-custom-fallback")} ${result.customFallback}` : ""),
    },
    {
      label: getString("field-nature-index"),
      matched: !result.natureError && result.natureIndex === true,
      value: result.natureError
        ? getString("journal-insights-unavailable")
        : getString(result.natureIndex ? "journal-insights-member" : "journal-insights-unmatched"),
      basis: result.natureError ? "" : basis(result.natureBasis),
      source: result.natureSource === "api" ? [getString("journal-insights-api-source"), result.natureAPIDataset].filter(Boolean).join(" · ") : getString(result.natureSource === "custom" ? "journal-insights-nature-custom" : "journal-insights-nature-builtin"),
      warning: (result.natureError === "journal-insights-api-missing" ? getString("journal-insights-api-missing") : result.natureError) || (result.natureAPIWarning ? getString("journal-insights-api-fallback") : "") || (result.natureFallback ? `${getString("journal-insights-nature-fallback")} ${result.natureFallback}` : ""),
    },
  ];
}
