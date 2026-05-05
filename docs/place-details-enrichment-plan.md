# Place Details Enrichment & AI Refinement Plan

## Overview

Implement a two-phase enrichment system that fetches rich Place Details for top candidates from Nearby Search, then applies both custom business logic scoring and AI-powered refinement using review summaries, generative summaries, and user reviews.

---

## Phase 1: Discovery (Nearby Search)

**Purpose**: Broad discovery within user's browse category and location.

**Current Implementation**:

- Uses `places:searchNearby` with curated type lists
- Returns up to 20 results initially
- Applies basic filters (dateTime, priceLevel, rating)

**Enhancement**:

- Return **top 15-20 candidates** from Nearby Search
- Don't over-filter at this stage—let enrichment and AI do the nuanced ranking

---

## Phase 2: Enrichment (Place Details API)

**Purpose**: Deep-dive into top candidates to get AI-friendly data.

### API Endpoint

```
GET https://places.googleapis.com/v1/places/{PLACE_ID}
```

### Field Mask Selection

**Tier 1: Essential for AI Context**

```
places.reviewSummary,
places.generativeSummary,
places.editorialSummary,
places.primaryTypeDisplayName,
places.types,
places.priceRange,
places.priceLevel
```

**Tier 2: Date-Fit Signals**

```
places.reservable,
places.outdoorSeating,
places.liveMusic,
places.goodForGroups,
places.servesCocktails,
places.servesWine,
places.servesBeer,
places.servesCoffee,
places.servesDessert,
places.servesDinner,
places.servesLunch,
places.menuForChildren,
places.allowsDogs
```

**Tier 3: Operational Context**

```
places.currentOpeningHours,
places.businessStatus,
places.openingDate,
```

**Tier 4: Deep Review Data (Limited)**

```
places.reviews,
places.rating,
places.userRatingCount
```

### Review Handling Strategy

**Option A: Summary-First (Recommended)**

- Primary: Use `reviewSummary` (AI-generated overview of all reviews)
- Secondary: Use top 3-5 individual reviews only if reviewSummary is missing or thin
- Benefit: Structured, comprehensive, AI-optimized

**Option B: Hybrid**

- Always include `reviewSummary`
- Add top 2 reviews that mention keywords: "date", "romantic", "anniversary", "first date", "atmosphere", "quiet", "loud", "service"
- Benefit: Captures edge-case insights not in summary

---

## Custom Business Logic Scoring

Apply lightweight scoring **before** AI refinement to establish baseline ranking.

### Scoring Dimensions

**1. Date Vibe Match (0-25 points)**

```typescript
if (dateVibe === 'romantic') {
  if (hasWineBar || hasCocktailBar) score += 10
  if (reviewSummary?.includes('romantic' | 'intimate' | 'cozy')) score += 15
  if (outdoorSeating && eveningTime) score += 5
}

if (dateVibe === 'adventurous') {
  if (isAmusementPark || isEscapeRoom || isAdventureSports) score += 15
  if (reviewSummary?.includes('unique' | 'exciting' | 'different')) score += 10
}

if (dateVibe === 'relaxed') {
  if (hasSpa || hasMassage || isPark) score += 15
  if (reviewSummary?.includes('chill' | 'relaxing' | 'laid back')) score += 10
}
```

**2. Time-of-Day Fit (0-20 points)**

```typescript
if (dateTime === 'Morning') {
  if (servesCoffee || servesBreakfast || isPark || isMuseum) score += 20
  if (liveMusicVenue) score -= 10 // Penalty—usually closed or quiet
}

if (dateTime === 'Evening') {
  if (servesDinner || servesCocktails || isBar || liveMusic) score += 20
  if (outdoorSeating && goodWeather) score += 5
}
```

**3. Group Size & Privacy (0-15 points)**

```typescript
if (activitySetting === 'indoor' && !outdoorSeating) score += 10
if (activitySetting === 'outdoor' && outdoorSeating) score += 10
if (activitySetting === 'mix' && bothOptions) score += 15
if (goodForGroups && priceLevel > MODERATE) score += 5 // Can handle special occasions
```

**4. Review Quality Signals (0-20 points)**

```typescript
baseScore = Math.min(rating * 4, 20) // 4.5 stars = 18 points

if (userRatingCount > 500) score += 2 // Established venue
if (userRatingCount > 1000) score += 3 // Very established

if (reviewSummary?.sentiment === 'veryPositive') score += 5
if (reviewSummary?.includes('date' | 'romantic' | 'special occasion'))
  score += 5
```

**5. Operational Confidence (0-10 points)**

```typescript
if (businessStatus === 'OPERATIONAL') score += 5
if (hasCurrentOpeningHoursData) score += 3
if (isOpenNow === true) score += 2 // Real-time confidence
```

**6. Amenities & Experience (0-10 points)**

```typescript
if (reservable) score += 3 // Can make plans
if (hasWebsite && hasMenuOnline) score += 2 // Research-friendly
if (generativeSummary?.includes('popular for' | 'known for')) score += 3
if (editorialSummary?.exists) score += 2
```

### Scoring Output

- Total: 0-100 points
- Use for initial sort: `customScore DESC`
- Pass top 10 to AI with full context

---

## AI Refinement Phase

### Input Data Structure

```typescript
interface PlaceEnrichmentPayload {
  id: string
  name: string
  primaryType: string
  customScore: number

  // Summaries
  generativeSummary?: string
  editorialSummary?: string
  reviewSummary?: string

  // Structured signals
  dateFitSignals: {
    servesAlcohol: boolean
    hasLiveMusic: boolean
    outdoorSeating: boolean
    reservable: boolean
    goodForGroups: boolean
  }

  // Reviews (top 3 if reviewSummary weak)
  sampleReviews?: Array<{
    text: string
    rating: number
    relativePublishTime: string
  }>

  // Operational
  priceLevel: string
  priceRange?: { low: number; high: number }
  rating: number
  userRatingCount: number

  // User preferences context
  userDateTime: string
  userVibe: string
  userActivitySetting: string
}
```

### AI Prompt Strategy

**System Prompt**:

```
You are a date planning expert. Rank these places from best to worst for a specific date scenario.

Consider:
1. Does it match the requested date vibe (romantic/adventurous/relaxed)?
2. Is it appropriate for the time of day?
3. What do reviews say about atmosphere, service, and date-friendliness?
4. Is it practical (reservable, reasonably priced, operational)?
5. Does it have "special" qualities that make it memorable?

For each place, provide:
- id: the place ID
- score: 1-100
- reason: one sentence explaining why this place fits or doesn't fit
- highlights: 2-3 bullet points of what makes it good for this date
- concerns: any red flags (too loud, inconsistent service, hard to get into, etc.)
```

**Few-Shot Examples**:
Include 2-3 examples of good/bad matches for different vibes.

---

## Implementation Phases

### Phase 1: Field Mask Expansion

1. Update `GOOGLE_FIELD_MASK` to include Tier 1-3 fields
2. Ensure existing Nearby Search still works
3. Test that new fields are returned

### Phase 2: Place Details Fetching

1. Create `fetchPlaceDetails()` function
2. Batch fetch for top 10 Nearby Search results
3. Add caching layer (TTL: 1 hour) to reduce API calls
4. Handle errors gracefully (fallback to Nearby Search data)

### Phase 3: Custom Scoring

1. Implement scoring rules for dateVibe, time, setting
2. Add unit tests with mock data
3. Validate against real API responses

### Phase 4: AI Refinement v2

1. Build enrichment payload builder
2. Update AI prompt with new context
3. Test ranking quality vs. baseline
4. A/B test with/without Place Details enrichment

### Phase 5: Review Integration

1. Add `reviews` field mask
2. Implement review filtering (date keywords, top rated)
3. Add to AI payload when reviewSummary is insufficient
4. Monitor token usage and latency

---

## Performance Considerations

**API Cost Management**:

- Nearby Search: ~$0.017 per request
- Place Details: ~$0.017 per request
- Enriching top 10 places = 10x cost increase
- **Mitigation**: Aggressive caching, batch where possible

**Latency**:

- Nearby Search: ~200-500ms
- 10x Place Details: ~500-1500ms (parallel)
- AI refinement: ~1000-3000ms
- **Total**: ~2-5 seconds for full enrichment
- **Mitigation**: Show loading state, stream results, cache popular areas

**Token Economy**:

- Place Details payload can be large
- Send AI only what it needs:
  - Omit full photos arrays
  - Truncate long summaries to 500 chars
  - Limit reviews to top 3 most relevant

---

## Success Metrics

**Quality Metrics**:

- User click-through rate on recommendations
- Saved/bookmarked places rate
- Manual search refinement rate (lower is better)

**Technical Metrics**:

- API cost per user session
- Average response time
- Cache hit rate
- AI ranking vs. custom scoring correlation

**Business Logic Effectiveness**:

- Track which scoring dimensions correlate with user selection
- Weight those higher in future iterations

---

## Quick Win: Immediate Field Mask Update

Can implement today without Place Details:

**Add to existing Nearby Search field mask**:

```
places.reviewSummary,
places.generativeSummary,
places.editorialSummary,
places.reservable,
places.outdoorSeating,
places.liveMusic,
places.servesCocktails,
places.servesWine,
places.servesBeer
```

**Benefit**: Get AI-friendly summaries immediately, zero additional API calls.

---

## Decision Points

1. **Start with field mask expansion?** (Yes—immediate value, no extra latency)
2. **Add Place Details for top N only?** (Yes—balance quality vs. cost)
3. **Use reviewSummary or raw reviews?** (Summary-first, reviews as backup)
4. **Custom scoring before AI?** (Yes—establishes baseline, reduces AI load)
5. **Cache duration?** (1 hour for Place Details, 24 hours for Nearby Search)

---

## Next Steps

1. ✅ Review this plan
2. Update field mask for immediate wins
3. Implement Place Details fetching
4. Build custom scoring engine
5. Enhance AI prompt with enriched data
6. Measure, iterate, optimize
