# Model Finder · launch site

Static launch website for **Model Finder by Indigloo**: a free, local MCP server + Agent Skills that finds the cheapest AI model that passes your own tests.

No build step, no npm, no third-party requests. Plain HTML + one stylesheet + one small script. Every font, image and the film are served from `assets/`, so it works offline.

Design system: **Quiet Instrument** (`evalharness/assets/DESIGN.md`): warm paper `#f3f0e8`, ink `#1c1b19` / `#141412`, graphite, and one signal colour, Indigloo orange `#f4690f` (darkened to `#b4460a` for text on paper so it passes WCAG AA). Type: Instrument Serif (display), Instrument Sans (body), Geist Mono (labels), all self-hosted Latin subsets under the SIL Open Font License.

## Preview locally

```bash
cd evalharness-listing/modelfinder-launch
python3 -m http.server 8080
# open http://localhost:8080
```

Use a server rather than `file://` so the video, fonts and clipboard behave like production (the clipboard API needs `localhost` or HTTPS).

## Files

```
index.html          Launch landing (hero + film, how it works, cost proof, privacy, clients, install, plates)
privacy.html        Privacy summary (mirrors PRIVACY.md in the repo)
security.html       Security summary + reporting (mirrors SECURITY.md)
terms.html          Terms summary (mirrors TERMS.md)
404.html            Not-found page (Cloudflare Pages / GitHub Pages pick it up automatically)
style.css           All styles, including reveal motion and prefers-reduced-motion overrides
app.js              Mobile nav, scroll reveal, film play button, install tabs, copy-to-clipboard
_headers            Security + cache headers for Cloudflare Pages / Netlify
robots.txt, sitemap.xml, .nojekyll
assets/fonts/       woff2 subsets (Instrument Serif regular/italic, Instrument Sans, Geist Mono)
assets/img/         Product Hunt gallery plates (PNG + WebP), Indigloo mark, favicons
assets/video/       model-finder-film.mp4 (29.5 s, 1920×1080, H.264, no audio, faststart)
```

## Accuracy rules (keep these when editing copy)

- The MCP server needs **no API keys**, never writes files, and sends nothing to Indigloo.
- Say **"10 of 11 tools make no network calls"**. `modelfinder_run_eval` is opt-in and calls only the providers you pick, with your keys, after `confirm: true`. Never claim "no network" in absolute terms.
- The cost-ranking plate (gallery-03) and the film use **illustrative** pass rates. They are labelled as such; don't quote the 8.1× figure as a measured result.
- PyPI currently serves **v1.3.5**. The repo is at 1.3.6 (unreleased). The site uses unpinned `uvx model-finder-mcp`; update the "v1.3.5" pill and install list when 1.3.6 is published.

## CSP and why there is no inline code

Every page carries a `<meta http-equiv="Content-Security-Policy">` that allows only same-origin scripts, styles, fonts, images and media, with no `unsafe-inline`. There are no inline `<script>` blocks or `style=""` attributes. The single exception is the `application/ld+json` block in `index.html`; it is a non-executable data block, so `script-src` does not apply to it.

`app.js` is loaded synchronously in `<head>` (not `defer`). It is ~6 KB and adds the `js` class before first paint so the reveal animations never flash content. Everything else waits for `DOMContentLoaded`. Without JS the page is fully readable: all install panels show, the video has native controls, and nothing is hidden.

`_headers` adds what a meta tag can't (`frame-ancestors`, HSTS, `nosniff`, `upgrade-insecure-requests`) on Cloudflare Pages or Netlify. GitHub Pages ignores it.

## Motion and accessibility

- Hero headline line reveal, scroll reveals, step timeline draw-in, tool-board stagger, provider/client marquee (pauses on hover).
- `prefers-reduced-motion: reduce` disables all of it; the marquee becomes a static wrapped list.
- The film **never autoplays**. It shows gallery-01 as a poster with a "Watch the film" button; native controls appear once it plays. `preload="none"` keeps the 1.5 MB file off the initial load.
- Skip link, visible `:focus-visible` rings, ARIA tabs with arrow-key support, `aria-live` copy confirmation, Escape closes the mobile menu.

## Deploy

The site is a folder of static files; any static host works. Absolute URLs in `<link rel="canonical">`, `og:url`, `og:image`, `robots.txt` and `sitemap.xml` assume **`https://modelfinder.indigloo.co`**. If you choose a different hostname, search-and-replace that string.

### Recommended: Cloudflare Pages

Applies `_headers` (real CSP and HSTS), has a global CDN, and makes the custom domain easy if indigloo.co's DNS is on Cloudflare.

```bash
npx wrangler pages deploy evalharness-listing/modelfinder-launch --project-name modelfinder
```

Or in the dashboard: Pages → Create → Direct upload (drag this folder), or connect a repo with build command *empty* and output directory set to this folder. Then Custom domains → `modelfinder.indigloo.co`. Cloudflare creates the `CNAME modelfinder → modelfinder.pages.dev` record if the zone is on Cloudflare; otherwise add that CNAME at your DNS provider.

### GitHub Pages

Push the folder's contents to a repo (or a `gh-pages` branch), enable Pages, and add a `CNAME` file containing `modelfinder.indigloo.co`. At DNS: `CNAME modelfinder → <user>.github.io`. Tick "Enforce HTTPS". The meta CSP still applies; `_headers` is ignored.

### Custom domain notes

- Recommended hostname: **`modelfinder.indigloo.co`**. It matches the product name on Product Hunt, PyPI (`model-finder-mcp`) and the MCP Registry (`co.indigloo/model-finder`), and leaves `find.` / `models.` free for other uses. Optionally 301 `find.indigloo.co` to it as a short vanity link.
- Don't touch the existing TXT record at the apex of `indigloo.co`; the MCP Registry uses it to verify the `co.indigloo` namespace.
- After the domain is live, check the social card with the Facebook Sharing Debugger / X Card Validator so `gallery-01-hero.png` is cached as the preview.

## Updating assets

The plates and film come from `evalharness-listing/product-hunt/`. To refresh: copy the new PNGs into `assets/img/`, regenerate WebP (`python3 -c "from PIL import Image; Image.open('x.png').convert('RGB').save('x.webp', quality=88, method=6)"`), and remux the film with `ffmpeg -i in.mp4 -c copy -movflags +faststart assets/video/model-finder-film.mp4`.
