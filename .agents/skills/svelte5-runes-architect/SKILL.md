---
name: svelte5-runes-architect
description: Architectural and implementation specialist for Svelte 5 and SvelteKit. Use when writing reactive state ($state, $derived, $effect, $props), building universal reactive domain classes (.svelte.ts), refactoring legacy Svelte 3/4 stores, and handling SSR/form action integration.
---

# Svelte 5 Runes Architect Skill

## Core Runes & Reactive Primitives
1. **`$state(initial)` & `$state.raw()`**:
   - Deep reactivity on objects and arrays with `$state()`.
   - Use `$state.raw()` for large immutable collections or third-party instances (e.g. editor instances, chart libraries) where proxy overhead is unnecessary.
2. **`$derived(expression)` & `$derived.by(() => ...)`**:
   - Synchronous, pure derived state. Never trigger side effects or mutations inside a derived expression.
   - Use `$derived.by()` when complex multi-line logic or conditional branching is required.
3. **`$effect(() => ...)` & `$effect.pre()`**:
   - Strictly reserved for synchronization with the external world (DOM, canvas, WebSockets, event listeners, local storage).
   - Never use `$effect` to synchronize state that can be derived directly with `$derived`.
4. **`$props()` & Snippets (`{#snippet name(args)}`)**:
   - Declare component inputs with typed destructuring: `let { title, count = 0, children }: Props = $props();`.
   - Replace legacy `<slot />` with reusable snippets and `render` tags.

## Universal Reactivity (`.svelte.ts`)
- Encapsulate rich domain logic in standard TypeScript classes utilizing runes:
  ```typescript
  export class CounterModel {
    count = $state(0);
    double = $derived(this.count * 2);

    increment() {
      this.count += 1;
    }
  }
  ```
- Expose methods that mutate internal state without needing external store subscribers.
