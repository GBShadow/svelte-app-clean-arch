---
name: debug-optimize-lcp
description: Guides debugging and optimizing Largest Contentful Paint (LCP) and Core Web Vitals (INP, CLS). Use when diagnosing slow page loads, hero image rendering bottlenecks, render-blocking resources, font delays, and critical rendering path issues.
---

# Core Web Vitals & LCP Optimization Skill

## Diagnosing LCP Breakdown
LCP is comprised of four sub-parts:
1. **Time to First Byte (TTFB)**: Server response and CDN latency. Target: < 800ms.
2. **Resource Load Delay**: Time from TTFB until the browser discovers the LCP element. Target: < 10% of total LCP.
3. **Resource Load Duration**: Network transfer and decompression time for the LCP resource.
4. **Element Render Delay**: Time from asset download until pixel painting (blocked by JS/CSS).

## Actionable Fixes
- **Hero Images / Banners**:
  - Add `<link rel="preload" as="image" href="..." fetchpriority="high">`.
  - Disable lazy-loading (`loading="eager"`, never `loading="lazy"`) on the above-the-fold hero image.
  - Serve modern formats with responsive sizes: `<picture>` with `image/avif`, `image/webp` and explicit `width`/`height` to avoid CLS.
- **Font Optimization**:
  - Use `font-display: swap` or `font-display: optional` to avoid FOIT (Flash of Invisible Text).
  - Self-host fonts and preload critical subsets.
- **Render-Blocking CSS & JS**:
  - Inline critical CSS required for the initial viewport.
  - Defer or asynchronously load non-critical scripts (`defer`, `type="module"`, dynamic imports).
  - Code-split large third-party bundles (analytics, chat widgets, heavy charting libraries).
