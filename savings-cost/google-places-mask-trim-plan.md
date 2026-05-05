# Google Places Cost Savings Plan

This document captures the search-mask versus Place Details mask decisions from the cost-savings planning session. The goal is to reduce Google Places spend while preserving high-quality date recommendations for users.

## Guiding Principle

- Prioritize user quality over lowest possible cost.
- Keep fields that materially improve filtering, date fit, AI ranking, descriptions, or user trust.
- Move expensive richness out of broad search and into tightly bounded finalist enrichment.
- Preserve search-provided data when merging details so useful signals are not lost.

## Search Mask Decisions

Search should be optimized for cheap broad discovery, not rich first-pass ranking. Search should keep only candidate identity and early filtering fields.

### Keep In Search

- `id`: required to identify candidates and fetch details.
- `displayName`: required for candidate identity and UI labels.
- `types`: required for basic AI/type filtering and inappropriate-place checks.
- `primaryType`: required for food/activity filtering and pre-scoring.
- `primaryTypeDisplayName`: currently useful context, but still open for final audit.
- `businessStatus`: keep in search only to avoid closed/unavailable places early.
- `currentOpeningHours`: keep in search to filter by `Now` and date-time slots before paying for details.
- `priceLevel`: keep in search to respect user budget before enrichment.
- `rating`: keep in search to filter weak candidates before enrichment.
- `userRatingCount`: keep in search to avoid enriching unreliable low-signal candidates.

### Move Out Of Search

- `photos`: move to details only. Photos improve trust and UI, but do not help early filtering.
- `websiteUri`: remove from search. It does not improve discovery, filtering, or ranking.
- `googleMapsUri`: remove from search. It is useful for final cards, but not broad discovery.

## Details Mask Decisions

Place Details should be split into a tightly bounded rich enrichment step. We decided that only the top 3 candidates per branch should receive expensive AI-rich details.

### Rich Details Limit

- Use rich Place Details for top 3 candidates per branch.
- Do not fetch cheaper standard details for candidates outside the top 3 at first.
- Choose the top 3 using a lightweight pre-score instead of raw Google order.

### Top 3 Selection

Use a lightweight pre-score after early filters and before rich details.

Potential pre-score inputs:

- Search order from Google.
- `rating`.
- `userRatingCount`.
- `priceLevel` match.
- `primaryType` and `types` date-fit signals.
- Activity or restaurant branch fit.
- Whether the place is open for the selected time.

## Keep In Rich Details

- `id`: stable identity.
- `displayName`: final card and AI context.
- `types`: AI/type context.
- `primaryType`: AI/type context.
- `googleMapsUri`: reliable final-card link to Maps details, directions, hours, photos, and reviews.
- `photos`: keep in details for final-card user trust.
- `priceLevel`: budget context.
- `priceRange`: keep because it feeds AI ranking and can improve budget-sensitive recommendations.
- `rating`: quality signal.
- `userRatingCount`: reliability signal.
- `generativeSummary`: high-value AI context for place concept and vibe.
- `editorialSummary`: useful curated description fallback.
- `reviewSummary`: highest-value AI context for customer sentiment.
- `reviews`: keep for top 3 because individual review snippets help the AI reason about noise, service, wait times, atmosphere, and date suitability.
- `reservable`: useful restaurant/date-night signal.
- `outdoorSeating`: useful restaurant and activity/date-fit signal.
- `liveMusic`: keep, including for restaurants, because it can materially affect date vibe.
- `goodForGroups`: keep, including for restaurants, because it can hint at atmosphere and suitability.
- `servesCocktails`: useful restaurant/date-night signal.
- `servesWine`: useful restaurant/date-night signal.
- `servesBeer`: useful restaurant/date-night signal.
- `servesCoffee`: useful casual/low-pressure date signal.
- `servesDessert`: useful date-night signal.
- `servesDinner`: useful date-time fit signal.
- `servesLunch`: useful date-time fit signal.
- `menuForChildren`: keep, including for restaurants, as a context signal.
- `allowsDogs`: keep, including for restaurants, as a context signal.

## Remove From Rich Details

- `regularOpeningHours`: removed because the app does not use it directly.
- `utcOffsetMinutes`: removed because the app does not use it directly.
- `currentOpeningHours`: remove from details because search already requests it. Preserve the search-provided value during merging.
- `businessStatus`: remove from details because search already requests it. Preserve the search-provided value during merging.
- `websiteUri`: remove from details. Use `googleMapsUri` for final-card links.
- `accessibilityOptions`: remove from both restaurant and activity details based on the planning decision.

## Merge Behavior Decision

- Preserve all existing search data when merging details.
- Details should enrich candidates, not erase search-provided fields.
- This matters especially for `currentOpeningHours` and `businessStatus`, which should remain available from search even if removed from details.

## Open Decision

- `primaryTypeDisplayName`: the final question was not answered. Current recommendation is to audit it separately. It may be removable from details if `primaryType` and `types` are enough for AI and UI context.

## Expected Savings Shape

- Search requests become cheaper by removing fields that do not affect discovery or early filtering.
- Expensive AI-rich Place Details are limited to top 3 candidates per branch.
- Skipping standard details for non-top-3 candidates avoids replacing one details cost with another.
- Removing `websiteUri`, `accessibilityOptions`, duplicate `currentOpeningHours`, duplicate `businessStatus`, `regularOpeningHours`, and `utcOffsetMinutes` reduces unnecessary fields while preserving the strongest user-quality signals.

## User-Quality Protections

- Keep summaries and reviews for top candidates because they drive recommendation quality.
- Keep rating and review count in search to avoid low-quality candidates.
- Keep opening hours in search to avoid recommending places that do not fit the selected date-time.
- Keep photos in details because they help users trust and evaluate suggestions.
- Keep Google Maps links so users can inspect details, directions, hours, and reviews.
