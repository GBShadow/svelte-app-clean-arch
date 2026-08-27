---
name: a11y-debugging
description: Uses Chrome DevTools, accessibility trees, and WCAG 2.2 guidelines for auditing and debugging accessibility. Use when checking semantic HTML, ARIA attributes, keyboard navigation, screen reader support, focus traps, tap targets, and color contrast.
---

# Accessibility (a11y) Auditing & Debugging Skill

## Core Concepts
- **Accessibility Tree vs DOM**: Screen readers parse the Accessibility Tree, not raw DOM styling. `display: none` and `aria-hidden="true"` hide from AT, whereas `opacity: 0` or `sr-only` classes behave differently.
- **WCAG 2.2 Standard**: Ensure Level AA compliance across Perceivable, Operable, Understandable, and Robust principles.

## Audit Workflow
1. **Automated Baseline**: Run Lighthouse / axe-core audits to find immediate missing `alt` tags, unlabeled form inputs, and color contrast errors.
2. **Keyboard Navigation & Focus Management**:
   - Verify logical tab order with `Tab` / `Shift+Tab`.
   - Modals and Drawers must trap focus inside and release it to the trigger element on close (`ESC` key support).
   - Interactive custom elements (`div` as button) must have `role="button"`, `tabIndex={0}`, and handle both `Enter` and `Space` keypresses.
3. **ARIA & Semantic HTML**:
   - Prefer native HTML (`<button>`, `<dialog>`, `<nav>`, `<main>`) over ARIA attributes.
   - Use `aria-expanded`, `aria-controls`, and `aria-live="polite"` for dynamic updates.
   - Ensure form inputs have matching `<label htmlFor="id">` or `aria-label`.
4. **Touch & Target Sizes**: All interactive elements on mobile must have a minimum bounding box of 44x44px (WCAG 2.5.5/2.5.8) or 48x48px (Material/Google recommendation).
