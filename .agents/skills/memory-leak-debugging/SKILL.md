---
name: memory-leak-debugging
description: Diagnoses and resolves memory leaks in JavaScript/TypeScript Single Page Applications and Node.js runtimes. Use when inspecting heap snapshots, identifying detached DOM nodes, uncleared intervals/listeners, and event emitter retention.
---

# JavaScript Memory Leak Debugging Skill

## Common Leak Vectors in Frontend SPAs
1. **Uncleared Subscriptions and Timers**:
   - `setInterval` or `setTimeout` running after component unmount.
   - RxJS / EventEmitter / WebSocket subscriptions without cleanup in `useEffect` return functions or `ngOnDestroy`/`onUnmounted`.
2. **Detached DOM Nodes**:
   - Storing references to DOM elements in global variables, closures, or module-scoped arrays after removing elements from the document tree.
3. **Event Listeners on Global Objects**:
   - Adding listeners to `window`, `document`, or `body` without removing them upon route change or teardown (`window.addEventListener('resize', handler)`).
4. **Closures Retaining Large Outer Scopes**:
   - Functions retaining parent scopes that hold big datasets, large cache objects, or heavy data grids.

## Heap Analysis Protocol
1. **Baseline Snapshot**: Take Heap Snapshot 1 after initial page load.
2. **Action Iteration**: Perform user interaction (e.g. open/close modal or navigate back/forth 10 times).
3. **Comparison Snapshot**: Force Garbage Collection (GC) in DevTools and capture Heap Snapshot 2.
4. **Delta Inspection**: Filter by objects allocated between Snapshots 1 and 2:
   - Check constructor count of `Detached HTMLElement`, `FiberNode`, and `Closure`.
   - Inspect the Retainer Tree to identify the root object preventing GC.
