# Help Center Articles - LLM Reference

**SCOPE**: Static HTML help center articles (66 articles)

---

## DIRECTORY_PURPOSE

Pre-rendered static HTML pages for the Help Center. SEO-friendly, fast-loading, works without JavaScript. Shared CSS/JS infrastructure across all articles.

---

## SUBDIRECTORY_STRUCTURE

| Directory | Intent | Details |
|-----------|--------|---------|
| `about/` | Platform explainer articles | What is Split Lease, platform overview |
| `css/` | Shared stylesheet | `style.css` - brand colors, typography, layout |
| `js/` | Shared JavaScript | `split-lease-nav.js` - navigation, breadcrumbs, Feather icons |
| `guests/` | Guest/renter help articles | Subdirs: before-booking, booking, during-stay, getting-started, pricing, trial-nights |
| `hosts/` | Host help articles | Subdirs: getting-started, legal, listing, management, managing |
| `knowledge-base/` | Educational/comparison articles | Platform comparisons, general rental knowledge |

URL pattern: `/help-center-articles/{audience}/{category}/*.html`

---

## ARTICLE_TEMPLATE_STRUCTURE

Each article page follows this layout:

- **Header**: Fixed Split Lease navigation (matches React Header component)
- **Breadcrumb**: Hierarchical navigation trail
- **Article Content**: Main content with headings, paragraphs, info boxes
- **Sidebar**: Related article navigation
- **Feedback**: User satisfaction survey
- **Footer**: Site-wide footer links

---

## SHARED_INFRASTRUCTURE

### Styling (css/style.css)
- CSS custom properties for brand colors
- Primary: #31135d (Deep Purple), Success: #4CAF50, Info BG: #F3E5F5
- Mobile-first responsive design consistent with main app

### JavaScript (js/split-lease-nav.js)
- Navigation menu and breadcrumb generation
- Feather Icons integration

### Icons
- Feather Icons via CDN (unpkg)
- Usage: `<i data-feather="icon-name"></i>` + `feather.replace()`

### Animations
- Lottie Player via CDN (lottiefiles)
- Usage: `<lottie-player src="/assets/lotties/*.json" loop autoplay>`
