# The PinkOut Journal

Arabic-first, bilingual static marketing website for PinkOut's planned women-first destination in Riyadh. The magazine-style layout, reference hero, original brand colors, logo and image assets are retained.

## Responsive containment

The page shell and section backgrounds use the full browser width, including wide desktop screens. Outer boxed gutters and mobile section margins are removed; a small responsive inset keeps text readable. The reference hero remains intact.

The header uses its mobile menu through 1100px, matching the JavaScript breakpoint. The desktop launch link stays hidden where it would crowd navigation. Grid children can shrink, headlines can wrap, and the horizontal destination strip scrolls inside its own container. Photo inserts sit inside their panels; supplemental photos use normal document flow. Large mobile photos and gallery cards do not rotate beyond their containers. The reading guide remains inside the viewport.

Destination cards align at the top with a reserved, consistent stagger; their masked photographs use square frames with a fixed inset instead of mismatched width and height. Journal note and collage photos now occupy normal grid space alongside their copy, stacking on mobile. The gallery follows the supplied reference: a horizontal strip of landscape images with rounded corners, alternating vertical offsets, white pill captions and circular open controls. Each image uses a 1.38 aspect-ratio frame without stretching, and the strip scrolls within its own container. Filters, swipe/scroll, previous/next buttons and the lightbox are retained. Section spacing is centralized in `layout.css`; external decorative waves and negative journal copy margins are removed. Pearls use a matte green surface with no shine or gloss. Tea cups and the café photo use normal grid flow rather than overlapping absolute positions.

## World photo frames

Each of the seven destination cards uses a unique, static SVG frame: portal arch (Pink Passage), rose (Rose Hub), beauty mirror (Beauty Lab), artist palette (Make Studio), shopping tag (Pink Market), fluid oval (Move Studio), and show ticket (PinkOut Live). Original photos and card interactions are retained. The frames use the original brand colors and add no animation or emoji.

## Icons

Utility arrows, close/plus controls, menu, pause/play and saved hearts use consistent inline SVG icons. Unicode icon glyphs and emoji were removed, including unused emoji in the bilingual copy. SVG viewBox casing is preserved.

## Lightweight motion

Short, 160ms opacity fades remain for text reveals and interaction feedback. Global parallax, 3D pointer tilt, magnetic buttons, clipping reveals and per-card stagger animations have been removed. There is one animation-frame-throttled scroll handler. Chapter positions are cached and refreshed when layout changes, instead of being read repeatedly during scrolling. Progress uses a transform, the reading guide has no backdrop blur, and mobile cards do not animate on hover.

The “All your favorites, together” spread uses a physics-inspired autonomous bubble-tea scene. A single Canvas 2D surface continuously deforms three milk contours using overlapping currents with different phases. Twenty-one pearls follow those currents with water drag, buoyancy equilibrium, gentle rotation, soft mass-weighted collisions and low-restitution boundaries. Motion stays in quiet background lanes to preserve text readability. This is an art-directed lightweight approximation, not a full fluid solver.

Mouse movement adds fading surface ripples and local displacement forces. The influence decays when movement stops; autonomous currents continue. Touch taps can create a ripple without interfering with scrolling. The liquid and pearls share the same current field. The original cups and Rose Hub photo remain static and their layout stays in normal grid flow.

Physics uses fixed 1/60-second steps with clamped elapsed time. Desktop pearl transforms render up to 60Hz; coarse-pointer devices render at 30Hz, with liquid redraws limited to 30Hz/24Hz respectively. Sustained slow frames lower pearl rendering to 30Hz. Canvas resolution is capped at 550,000 pixels and 1200px per dimension; it does not scale up with device pixel ratio. Geometry is cached and updated on resize. One animation loop is active only while the section is visible. Offscreen sections, hidden tabs, system reduced motion and the pause control stop it; resuming does not advance through the paused interval. No animated blur, image filters, layout properties or extra dependencies are used. Generated artwork provenance is in `assets/tea/ARTWORK.md`.

The pause control finishes active fades. System reduced-motion preferences disable them. All essential content remains visible without JavaScript or animation support.

## Interaction and launch status

Language switching, destination selection, saved moments, filters, day routes, lightbox, chapter guide, navigation and FAQ remain available. Venue imagery and programming remain conceptual; opening details, final admission rules and the app retain their existing prelaunch status. Registration and partnership channels remain pending. No backend, live booking or fake submission was added.

## Static deployment

Upload `index.html`, `styles.css`, `layout.css`, `content.js`, `app.js`, `motion.js`, `tea-physics.js`, `tea.js` and `assets/` directly into the public web root. No framework, build step, Node.js runtime or backend is required.

Also deploy `hero-bg-ob.css`, `program-effects.js`, `moments.js`, `robots.txt`, `sitemap.xml` and `_headers`. Keep all referenced assets, including the new `assets/logo-96.webp`.

## Search and AI discovery improvements — October 15, 2026

The Arabic HTML contains the main content and 13 readable FAQ answers without requiring JavaScript. JSON-LD describes the organization, website, page and those same visible questions. Language switching updates descriptions, sharing metadata, schema language and FAQ answers together. No unconfirmed address, opening date, event schedule or ticket offer is asserted in structured data. FAQ markup helps describe content; it does not guarantee a Google rich result or AI citation.

`robots.txt` permits crawlers and points to the canonical homepage sitemap. The canonical domain remains the existing `https://pinkoutsa.com/`. There are no separate English URLs, so no unsupported language-alternate URLs were added. Open Graph and Twitter card metadata provide sharing titles, descriptions and imagery.

The header now uses a 96px WebP logo (about 4 KB versus the original 1.1 MB). Images below the hero use native lazy loading, and sourced images decode asynchronously. Existing responsive WebP images, deferred scripts, font swapping and offscreen animation controls are retained. Original source artwork stays in the repository but is not requested by the page.

`_headers` provides seven-day asset caching and revalidation for page/code files on compatible hosts such as Cloudflare Pages and Netlify. On other hosts, configure equivalent headers directly. Because asset names are not content hashes, replace changed assets with a new filename or purge the cache when updating them.

Before production verification:

1. Deploy these files to the existing domain. Configure Brotli or gzip for HTML, CSS, JS, JSON/XML and SVG at the host/CDN; this cannot be enabled by HTML alone.
2. Verify HTTPS, a single preferred host, permanent redirects from alternate hosts and `/index.html` to `/`, genuine 404 responses, and HTTP 200 responses for the homepage, robots and sitemap.
3. Submit `https://pinkoutsa.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools. Inspect the live URL and check structured data using Google's tools.
4. Measure mobile and desktop performance with PageSpeed Insights after deployment. Targets at the 75th percentile: LCP ≤2.5 seconds, INP ≤200 ms and CLS ≤0.1. Server response time, compression and real-user results remain unverified locally.

Run `python3 scripts/check-search.py` to validate metadata, FAQ consistency, image attributes, anchors, resource references and sitemap syntax. JavaScript syntax and whitespace checks also passed for this update. Browser rendering and performance measurements were unavailable because no browser is connected in this session. These changes are local; production deployment has not been performed.

References: [Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) and [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Verification

83 DOM/source/physics simulation checks passed, including original interactions, autonomous liquid and pearl motion, rotation, mouse ripples, loop lifecycle, mobile autonomy, pixel budgets, soft collisions, pointer force, gallery-strip navigation, matte pearls and reference card structure. Five 60-second physics simulations at widths 320, 393, 768, 1440 and 2560 checked finite values, containment and speed on every step. Syntax, assets, anchors, translations and original asset bytes were checked. Browser visual rendering and actual desktop/mobile frame rates were not measured in this environment.

## ZIP deployment

The ZIP contains the complete static website at its root: `index.html`, both stylesheets, all JavaScript, bundled fonts, photographs, SVG frames and tea artwork. Extract it and copy its contents to your web server’s document root. Keep both CSS files and all script files; `layout.css` supplies the final layout corrections. No package installation or build command is needed. Existing booking and signup channels remain in their documented prelaunch state.

## Sticker image optimization

The hero uses transparent WebP stickers at 140, 280 and 420 pixels, selected through `srcset` and CSS-matched `sizes`. Decorative stickers have low fetch priority and asynchronous decoding. The original PNGs are retained as source artwork; the page no longer downloads them.

All 12 originals total 18,819,589 bytes. The 12 optimized images total 61,754 bytes at 140px, 169,298 bytes at 280px, or 304,770 bytes at 420px (98.4–99.7% smaller). Browsers select one size per image according to display size and pixel density. These are asset-size measurements, not measured page-load times.

To regenerate after changing the original PNG artwork, install the WebP `cwebp` command and run `python3 scripts/optimize-stickers.py`. Deploy the generated WebP files with `index.html`. All 36 generated images were verified to decode and all sticker image references were checked.

## Search favicon

Deploy `favicon.png` (96 × 96) and `favicon.ico` to the public web root together with the updated `index.html`. These use the existing PinkOut logo. The previous favicon declaration pointed to a rectangular SVG; the homepage now declares a square PNG and an ICO fallback at stable root URLs. `robots.txt` already permits crawling. After deployment, verify both icon URLs return HTTP 200 with image content, then request homepage indexing in Google Search Console. Google may take days to weeks to refresh the search icon.
