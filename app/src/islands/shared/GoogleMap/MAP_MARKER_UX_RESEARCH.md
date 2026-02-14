# Map Marker UX Research — Agent 3 (UX/Product)

**Date**: 2026-02-14
**Status**: Research complete, recommendation delivered
**Scope**: Competitive analysis, interaction patterns, and holistic solution proposals for map marker density on the search page

---

## Current State

Split Lease's search map uses a **two-layer system**:
- **Purple pills** (`#5B21B6`, z-index 1002) — filtered search results
- **Grey pills** (`#9CA3AF`, z-index 1001) — all active listings (background context)
- Both layers show **full price labels** (`$XX.XX` in rounded pills, min-width 50px, padding 6px 12px, font-size 14px)
- `MapLegend` toggle lets users hide the grey layer
- Clicking any pin opens `ListingCardOverlay` with image carousel, pricing, and actions
- Hovering a listing card in the left panel triggers `highlightListing()` — adds `.pulse` CSS animation (no map panning, respects `prefers-reduced-motion`)
- All markers are `OverlayView` custom overlays (not native Google Markers), rendered immediately with no lazy loading or zoom-dependent filtering
- `MobileMapModal` reuses the exact same `GoogleMap` component in a full-screen dialog
- Pin positions do NOT need exact addresses — search page hides exact locations

**The core problem**: Every listing gets a full price pill at every zoom level. With 50+ listings, pills overlap into an unreadable blob. Each pill occupies ~80-100px wide x 30px tall. Beyond ~25 pills in a viewport the map becomes a solid wall of overlapping text.

---

## Competitive Analysis

### Summary Table

| Feature | Airbnb | Zillow | Redfin | Booking.com |
|---------|--------|--------|--------|-------------|
| **Low zoom markers** | Two-tier: price bubbles for high-probability listings + tiny white "mini-pins" (no price) for the rest | Numbered cluster badges showing aggregate count | Dynamically-sized cluster markers proportional to listing count | Neighborhood clusters with numbered badges; zoom restricted to city level |
| **Medium zoom** | More mini-pins promote to price bubbles as viewport narrows; algorithmic ranking decides which | Clusters break apart into individual purple price pins | Sub-neighborhood clusters that split progressively | Individual markers begin appearing, ranked by business criteria |
| **High zoom** | All visible listings show individual price bubbles | Individual markers with price labels; multi-unit buildings get interactive floor plans | All clusters dissolved; individual pins with price labels | Full price badge markers for all properties in viewport |
| **Clustering method** | **No geometric clustering** — algorithmic filtering by booking probability. Fewer pins = more bookings | Grid-based clustering (standard Google marker clusterer) | Server-side clustering (zoom 0-10), client-side (zoom 11+); 60x60px grid algorithm | Quadtree + BFS; importance-ranked within visible bounding box |
| **Visual density handling** | Mini-pins (small white ovals, no price) for low-priority; ~8x lower click rate than regular pins | Purple pins against muted map tones; transitions from clusters to price labels | Proximity-based aggressive clustering prevents overlap entirely | Restrictive zoom prevents zooming out past city level; selective display by importance |
| **Interaction on overlap** | Mini-pins enlarge on hover to show price; no spiderfier | Click cluster to zoom; individual pins when close enough | Click cluster zooms to bounds; hover shows breakdown (types, price range, avg) | Click cluster zooms in; hover shows property tooltip |
| **Opacity approach** | No opacity variation; visual hierarchy via size (mini vs regular) | No documented opacity; color coding for status (for sale, pending, sold) | No documented opacity; relies on clustering to prevent overlap | No opacity; color-codes sold-out (red) vs available |
| **List-map sync** | Historically: hover card -> highlight pin. Current: some platforms toggle between list/map views | Split-screen; synchronized selection between map markers and list cards | Auto-refresh listings on pan/zoom (bounding-box search); no manual "search this area" button needed | Hover on list highlights map marker; click syncs both views |

**Key finding: No major platform uses opacity/translucency to manage density.** They all solve it structurally — Airbnb shows fewer pins (algorithmic filtering), Zillow/Redfin merge pins into clusters (geometric grouping), Booking.com restricts zoom + importance ranking.

### Airbnb Deep Dive

Airbnb's approach is the most relevant to Split Lease because they also show price bubbles (not generic pins):

- **Two-tier pin system**: "Regular pins" (oval price bubbles) for high booking-probability listings. "Mini-pins" (small white/grey ovals WITHOUT prices) for everything else. Mini-pins are ~8x lower click rate — users self-filter by visual weight.
- **Algorithmic filtering, not clustering**: They don't merge pins geometrically. They choose WHICH pins to show based on booking probability, search relevance, and viewport. This is fundamentally different from Zillow/Redfin's cluster approach.
- **Hover promotion**: Mini-pins enlarge on hover to show price. This preserves discoverability without cluttering the default view.
- **Key insight from their engineering blog**: "Less is more — showing fewer pins results in more bookings."

### Zillow/Redfin Deep Dive

Both use standard geometric clustering:

- **Grid-based algorithm**: 60x60px grid cells, markers within the same cell merge into a numbered cluster badge
- **Progressive dissolution**: Clusters split as you zoom in. At zoom ~14+ all clusters are dissolved into individual pins.
- **Redfin hover on cluster**: Shows breakdown of home types, price range, and average price — a genuinely useful tooltip pattern
- **Weakness for Split Lease**: Cluster badges ("12") tell the guest nothing about price. For a platform where price scanning IS the primary map behavior, counts are less useful than curated prices.

### Google Maps POI Strategy

- **Collision Behavior API** (2024): Three modes — `REQUIRED` (always show), `OPTIONAL_AND_HIDES_LOWER_PRIORITY` (show if no collision), `REQUIRED_AND_HIDES_OPTIONAL` (always show, hide optional overlaps)
- **POI Density Control API** (2024): Per-category density dial — turn up restaurants, turn down retail
- **Spiderfier pattern**: <=8 overlapping markers spread in circle, 9+ in spiral. Available via OverlappingMarkerSpiderfier library.
- **Supercluster algorithm**: Processes 400,000 points in <1 second. Hierarchical zoom-level caching.

---

## Information Architecture Analysis

### Should grey markers show prices?

**No.** Grey markers should be small dots or circles, not full price pills.

- Airbnb's mini-pins (no price) get 8x fewer clicks than regular pins — users self-filter by visual hierarchy
- Showing prices on grey markers creates visual noise that competes with the purple results
- A grey dot says "something exists here" without demanding attention
- The price is irrelevant for grey markers — they don't match the user's filters

### Should grey markers be interactive?

**Minimally.** Hover to reveal price tooltip. Click to expand into a pill with price + card.

- Grey markers represent listings that DON'T match filters — making them equally interactive undermines the filter system
- But completely dead markers feel broken. A hover-to-reveal pattern (like Airbnb's mini-pins) gives power users a discovery path without cluttering the default view.

### Should visible marker count adapt to zoom level?

**Yes.** This is the single highest-impact change.

- City-wide zoom (10-12): Show at most 15-20 purple pins. Hide grey markers entirely or show only dots.
- Neighborhood zoom (13-14): Show all purple pins. Show grey dots.
- Street zoom (15+): Show all purple pins with prices. Grey dots get hover-to-reveal.

### Density threshold?

~25 full-size price pills in a viewport makes the map unreadable at current pill dimensions.

### Heatmap mode?

Not recommended for Split Lease's scale. Heatmaps work for 500+ data points. With typical NYC listing density (20-100 listings), a heatmap would look sparse and uninformative.

---

## Interaction Pattern Proposals

### Hover listing card in left panel -> Map response

**Current**: `highlightListing()` adds `.pulse` CSS animation (scale bounce + purple highlight). No map panning.

**Proposal**: Keep the no-pan approach (prevents motion sickness). Replace the bounce animation with a **subtle ring glow** — `box-shadow: 0 0 0 3px rgba(91, 33, 182, 0.5)` with a z-index boost. The pulse is visually aggressive; a static glow ring is calmer and just as visible.

### Hover a pin -> List response

**Current**: Nothing happens in the list panel.

**Proposal**: Scroll the left panel to the corresponding listing card and add a brief highlight flash (light purple background that fades over 1s). Creates a **bidirectional link** between map and list. Implementation path: `onMarkerHover` callback from `markerFactory.js` -> `GoogleMap` -> `SearchPage` scrolls to card.

### Click overlapping markers

**Current**: Topmost marker (highest z-index) captures click. Lower markers unreachable.

**Proposal (with zoom-filtering)**: At low zoom, there are fewer pins so overlap is reduced. Remaining overlaps handled by click-to-zoom — clicking a tight cluster of 2-3 pins zooms in one level, spreading them apart.

**Alternative (Spiderfier)**: On click of overlapping area, pins spread outward in a circle/spiral. Would need adaptation for custom OverlayViews. Better UX for street-level overlap where zooming further doesn't help.

### "Declutter" button

**Not recommended.** It's a power-user concept that adds cognitive load. The "Show all listings" toggle already serves this purpose. Density management should be **automatic** through zoom-dependent filtering.

### Auto-zoom on cluster click

**Yes.** Universal standard. Clicking a cluster should `fitBounds()` to the cluster's geographic extent.

---

## Proposed Solutions

### Solution A: "Smart Dots"

**Vision**: Grey markers become tiny dots. Purple markers remain price pills but thin out at low zoom. The map feels clean and purposeful at every zoom level.

**What it feels like**: At city zoom, you see 15-20 purple price pills spread across NYC with a subtle constellation of grey dots showing market depth. As you zoom into a neighborhood, more purple pills appear and grey dots get slightly larger. At street level, every listing is visible and hovering a grey dot reveals its price.

**Components**:
- Grey marker visual change: 8px circular dots instead of full price pills
- Zoom-dependent filtering for purple markers
- Hover-to-reveal on grey dots

**What improves for the user**: Map is readable at any zoom. Grey dots provide spatial awareness without visual competition. No loss of information — just progressive disclosure.

**Zoom mockup**:
- Zoom 10 (all NYC): 12-15 purple price pills, ~40 tiny grey dots barely visible
- Zoom 12 (2-3 neighborhoods): 20-30 purple pills, grey dots slightly larger (10px)
- Zoom 14 (single neighborhood): All purple pills visible, grey dots clearly visible with hover-to-reveal
- Zoom 16 (street level): Full detail, everything visible and well-separated

### Solution B: "Progressive Clustering"

**Vision**: Standard Zillow/Redfin approach. At low zoom, nearby markers merge into numbered cluster badges. Zoom in to dissolve clusters into individual pins.

**What it feels like**: At city zoom, you see 5-8 purple cluster circles with numbers ("12", "5", "8") across NYC. Clicking one smoothly zooms to that area. Clean, predictable, industry-standard.

**Components**:
- Grid-based clustering algorithm (60x60px cells)
- Cluster marker visual (purple circle with white count text)
- Click-to-zoom on clusters
- Grey layer removal or separate clustering

**What improves for the user**: Zero overlap at any zoom level. Instantly familiar from every real estate site.

**What's lost**: Individual price scanning at low zoom. A badge saying "12" tells the guest nothing about prices. For a rental platform where price scanning IS the primary map behavior, this trades information for cleanliness.

**Zoom mockup**:
- Zoom 10: 5-8 purple circles ("12", "8", "15"...) across NYC. No grey layer. Extremely clean.
- Zoom 12: Clusters split to ~15 smaller clusters ("3", "2", "4"...) and some individual pins.
- Zoom 14: Most clusters dissolved. Individual purple price pills visible.
- Zoom 16: No clusters. All individual pins.

### Solution C: "Opacity Layers"

**Vision**: Keep current pills but use opacity to create visual depth. Dense areas become translucent, isolated markers stay crisp.

**Components**:
- Overlap detection (pairwise pixel distances)
- Opacity formula based on neighbor count

**What improves for the user**: Almost nothing. Semi-transparent overlapping text is worse than opaque overlapping text. You can't read "$85.00" at 30% opacity on top of "$92.00" at 30% opacity.

**Not recommended.** No competitor uses this because it doesn't solve readability.

### Solution D: "Airbnb Hybrid" (RECOMMENDED)

**Vision**: The full experience. At low zoom, a relevance algorithm selects the top N listings to show as price pills. Everything else is a mini-dot. Bidirectional hover sync between map and list. Dynamic legend showing "Showing 15 of 47 listings — zoom in to see more."

**What it feels like**: The map is curated. It feels like someone hand-placed pins for maximum clarity. You see the "best" options immediately. As you explore (zoom/pan), more options appear naturally. The left panel and map feel like one unified interface.

**Components**:
- Relevance scoring (price proximity to median, distance from viewport center, listing quality signals)
- Smart Dots (from Solution A) for below-threshold listings
- Dynamic legend: "Showing 15 of 47 results. Zoom in to see more."
- Bidirectional hover: pin <-> card sync in both directions
- Mini-pin promotion animation: dot smoothly expands to price pill when zooming causes it to "promote"

**What improves for the user**:
- Map is curated at every zoom, not a data dump
- Grey dots provide ambient context without noise
- Bidirectional hover makes map and list feel like one interface
- Dynamic legend teaches the zoom-to-explore behavior
- Promotion animation makes the system feel intentional rather than glitchy

**Zoom mockup**:
- Zoom 10 (all NYC): 12-15 purple price pills (top-ranked by relevance) spread across boroughs. ~40 tiny grey dots. Legend: "Showing 15 of 47 — zoom in for more". Clean price overview.
- Zoom 12 (2-3 neighborhoods): 25 purple pills visible (more promoted by relevance recalculation). Grey dots 10px. Legend updates count.
- Zoom 14 (single neighborhood): All purple pills for this area visible. Grey dots hoverable. Promotion animation plays for newly-visible pills.
- Zoom 16 (street level): Full detail. Every listing visible. Purple pills and grey dots well-separated.

---

## Recommendation: Solution D — "Airbnb Hybrid"

### Why

The map is the first thing a guest sees on the search page. It's the spatial anchor for their entire browsing session. A cluttered map doesn't just look bad — it actively prevents guests from understanding what's available where. Every second a guest spends squinting at overlapping pills is a second closer to them leaving.

Solution D is the only option that treats the map as a **curated experience** rather than a data dump:

**Relevance-ranked pins** — A guest searching for a 4-night stay in Brooklyn doesn't need to see 47 pills. They need to see the 12-15 best options immediately, with confidence that zooming in reveals more. Airbnb proved it: fewer pins -> more bookings. The guest feels served, not overwhelmed.

**Grey dots instead of grey pills** — The grey layer currently fights the purple layer for attention. A guest's eye can't distinguish "matches my search" from "doesn't match my search" at a glance because both layers scream the same visual weight. Dots fix this. Purple pills become the signal; dots become ambient context.

**Bidirectional hover sync** — Hovering a card pulses the pin, but hovering a pin does nothing in the list. That's a one-way mirror. Guests naturally try both directions. When hovering a pin doesn't highlight the card, the map and list feel disconnected.

**Dynamic legend ("Showing 15 of 47 — zoom in for more")** — Without this, a guest at zoom 10 seeing 15 pins thinks there ARE 15 listings. The legend closes the information gap and teaches the zoom-to-explore behavior.

**Mini-pin promotion animation** — When a dot expands into a price pill as you zoom in, the guest understands WHY they're zooming. The map teaches its own interaction model through motion. Without this, new pins just pop in, which feels glitchy.

### Why not the others?

- **Solution A (Smart Dots)**: Gets you dots and zoom-filtering but skips relevance ranking and bidirectional hover. The core density problem (too many purple pills) remains partially unsolved — you're still showing ALL purple pins at every zoom, just with a cleaner grey layer.
- **Solution B (Clustering)**: Destroys information. A badge saying "12" tells the guest nothing about price. For a platform where price scanning is the primary map behavior, replacing prices with counts is a step backward. Zillow can do this because they have thousands of listings per city. Split Lease has dozens — each one matters.
- **Solution C (Opacity)**: Doesn't work. Semi-transparent overlapping text is functionally identical to opaque overlapping text. No competitor uses it.

### Iterability

Solution D is built from independent pieces that each deliver value alone:

1. **Grey dots** — ship first. Immediate visual improvement, no dependency on anything else.
2. **Bidirectional hover** — ship next. Makes the existing map feel responsive and connected.
3. **Zoom-dependent filtering** — ship next. Thins out purple pins at low zoom.
4. **Dynamic legend** — ship alongside or after filtering. Closes the information gap.
5. **Relevance scoring** — ship last. Upgrades "show closest N" to "show best N." Start with dead-simple score (distance from center + price normalization) and refine over time.
6. **Promotion animation** — polish layer. Ship whenever.

Each step is independently testable with real users. If grey dots alone solve 80% of the problem, stop there. If bidirectional hover confuses mobile users, revert it without touching anything else. The pieces don't depend on each other.

### Mobile Compatibility

`MobileMapModal` reuses the exact same `GoogleMap` component with the same props. All proposed changes flow through `markerFactory.js` and `useMapMarkers.js` which are shared. Grey dots are actually MORE touch-friendly on mobile than overlapping price pills — small separated targets are easier to tap than a wall of overlapping pills.

### Accessibility

- Grey dots: `aria-label="Listing at $XX.XX (not matching current filters)"` for screen readers
- Existing `.pulse` animation respects `prefers-reduced-motion` (static outline fallback) — maintain this for all new animations
- Hover-to-reveal on grey dots should also work on `focus` for keyboard navigation
- Dynamic legend is a live region (`aria-live="polite"`) that announces count changes

---

## Sources

### Airbnb
- [Improving Search Ranking for Maps — Airbnb Tech Blog](https://medium.com/airbnb-engineering/improving-search-ranking-for-maps-13b03f2c2cca)
- [Airbnb Map Platform — Adam Shutsa](https://adamshutsa.com/map-platform/)
- [Mini-pin community discussion](https://community.withairbnb.com/t5/Ask-about-your-listing/AirBnB-Map-Symbols-Small-Unlabeled-White-and-Gray-Shapes/m-p/1872402)

### Zillow
- [Using Maps As The Core UX In Real Estate Platforms](https://raw.studio/blog/using-maps-as-the-core-ux-in-real-estate-platforms/)
- [Tile It Up — Zillow Tech Hub](https://www.zillow.com/tech/tile-it-up/)
- [Interactive Property Maps](https://zillow.mediaroom.com/2023-03-15-Room-with-a-view-Renters-can-now-use-interactive-property-maps-to-choose-their-apartment-on-Zillow)

### Redfin
- [Cluster Buck Rogers — Redfin](https://www.redfin.com/news/cluster_buck_rogers/)
- [Lumped Together — Redfin Home Clusters](https://yochicago.com/lumped-together-redfin-maps-home-clusters/17355/)

### Booking.com
- [How Booking.com Efficiently Searches for POI Markers](https://medium.com/@GradlyDistributed/test-6-1b3e990e166b)
- [Booking.com Leverages Location Context](https://www.avuxi.com/blog/use-case-review-how-booking-com-leverages-location-context-to-boost-conversions)

### Google Maps APIs
- [Marker Collision Management](https://developers.google.com/maps/documentation/javascript/examples/marker-collision-management)
- [POI Density Control](https://developers.google.com/maps/documentation/javascript/cloud-customization/poi-behavior-customization)
- [Marker Clustering](https://developers.google.com/maps/documentation/javascript/marker-clustering)
- [Supercluster Algorithm](https://blog.mapbox.com/clustering-millions-of-points-on-a-map-with-supercluster-272046ec5c97)

### General
- [Optimal Layout for Hotel Search Results — Baymard Institute](https://baymard.com/blog/accommodations-split-view)
- [Map UI Patterns — Cluster Marker](https://mapuipatterns.com/cluster-marker/)
