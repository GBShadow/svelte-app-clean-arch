---
name: responsive-layout-systems
description: Layout architecture specialist for resilient, responsive, and adaptive web interfaces. Use when building complex grids, flexbox layouts, Container Queries (@container), fluid typography, and multi-breakpoint UI systems.
---

# Responsive Layout Systems Specialist Skill

## Core Principles
1. **Container Queries First**:
   - Favor `@container` over viewport media queries for modular components (cards, sidebars, widgets).
   - Component adapts to the available space of its parent container rather than whole screen dimensions.
   ```css
   .card-container {
     container-type: inline-size;
   }
   @container (min-width: 480px) {
     .card { flex-direction: row; }
   }
   ```
2. **CSS Grid for 2D, Flexbox for 1D**:
   - Use CSS Grid for overall page scaffolding, complex dashboard dashboards, and auto-fitting item grids (`grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`).
   - Use Flexbox for navigation bars, item alignments, button clusters, and linear toolbars.
3. **Fluid Typography & Spacing with `clamp()`**:
   - Avoid rigid breakpoint jumps for headings: `font-size: clamp(1.5rem, 4vw + 1rem, 3rem);`.
   - Scale padding and margins fluidly to prevent horizontal scrollbars on narrow screens (`< 360px`).
4. **Layout Shift (CLS) Prevention**:
   - Always define aspect ratio (`aspect-ratio: 16/9`) or explicit dimensions on containers containing dynamic or lazy-loaded media.
