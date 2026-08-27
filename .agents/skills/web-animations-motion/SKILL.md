---
name: web-animations-motion
description: Web animation and micro-interaction specialist. Use when designing smooth transitions, orchestrating layout animations (Framer Motion, Motion One, Svelte transitions, CSS animations), and enforcing accessibility (prefers-reduced-motion).
---

# Web Animations & Motion Design Specialist Skill

## Core Principles & Performance
1. **Hardware-Accelerated Properties Only**:
   - Strictly animate `transform` (`translate`, `scale`, `rotate`) and `opacity`.
   - Never animate layout triggers like `top`, `left`, `width`, `height`, `margin`, or `padding` to avoid main-thread recalculations and jank.
2. **Accessibility & Reduced Motion (Mandatory)**:
   - Always honor user accessibility preferences:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. **Natural Easing & Timings**:
   - Use cubic-bezier curves for organic movement (e.g. `cubic-bezier(0.16, 1, 0.3, 1)` for smooth decelerations).
   - Micro-interactions (button click, tooltip): 100ms – 200ms.
   - Screen transitions & modals: 250ms – 350ms.
   - Heavy animated entrances: 400ms – 600ms with subtle stagger effects.
