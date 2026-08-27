---
name: frontend-design
description: Design philosophy guide and visual design system specialist. Use when building UI components, landing pages, dashboards, designing typography, color palettes, spacing hierarchies, motion, and Tailwind CSS layouts.
---

# Frontend Design & Visual System Skill

## Core Principles
1. **Design Tokens & System Consistency**: Always enforce standardized spacing (4px/8px grid), consistent color scales (light/dark mode with semantic tokens like `--background`, `--foreground`, `--primary`, `--muted`), and clean typographic hierarchy.
2. **Framework & Library Agnostic**: Design with modern utility-first CSS (Tailwind CSS v3/v4), CSS Modules, or Design Tokens. Avoid inline arbitrary hardcoded magic numbers (`h-[347px]`).
3. **Hierarchy & Polish**:
   - Establish strong visual hierarchy: Headline > Subhead > Body > Supporting caption.
   - Use subtle borders, elevation (soft multi-layered box shadows), and backdrop blur instead of harsh, high-contrast outlines.
   - Micro-interactions: Add smooth transitions (`transition-all duration-200 ease-in-out`), hover states, focus rings, and active states to all interactive elements.

## Layout & Responsive Patterns
- **Container Queries & Grid**: Favor CSS Grid for 2D layouts and Flexbox for 1D toolbars/lists. Use `@container` for modular cards that adapt to their container rather than the viewport.
- **Mobile First**: Design base styles for small viewports (`< 640px`) and scale progressively with `sm:`, `md:`, `lg:`, `xl:` breakpoints.
- **Empty & Loading States**: Every interactive data view must include a designed Skeleton/Loading state, Empty state with clear Call to Action (CTA), and Error state.

## Component Quality Checklist
- [ ] Accessible color contrast ratio (minimum 4.5:1 for normal text, 3:1 for large text).
- [ ] Visible `:focus-visible` ring on all interactive components.
- [ ] Fluid typography using `clamp()` or scalable rem units.
- [ ] Dark mode compatibility using semantic CSS variables.
- [ ] Clean, self-explanatory component props interface.
