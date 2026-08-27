---
name: api-contract-and-mocking
description: Designs and generates type-safe API contracts, MSW (Mock Service Worker) handlers, tRPC routers, and OpenAPI/Swagger integrations. Use when mocking REST/GraphQL endpoints, stubbing network states, and ensuring frontend type safety.
---

# API Contract & Mocking (MSW, tRPC, OpenAPI) Skill

## Core Responsibilities
1. **Mock Service Worker (MSW v2)**:
   - Intercept network requests at the network level (Service Worker in browser, Node `SetupServer` in tests).
   - Maintain a single source of truth for mocks across development, Storybook, unit tests (Vitest), and E2E tests (Playwright).
   ```typescript
   import { http, HttpResponse } from 'msw';

   export const handlers = [
     http.get('/api/users', ({ request }) => {
       return HttpResponse.json([
         { id: '1', name: 'Dev User', role: 'admin' }
       ]);
     }),
     http.post('/api/auth/login', async ({ request }) => {
       const body = await request.json();
       if (!body.email) return new HttpResponse(null, { status: 400 });
       return HttpResponse.json({ token: 'mock-jwt-token' });
     }),
   ];
   ```

2. **Type-Safe Contract Enforcement**:
   - Validate incoming/outgoing API payloads using **Zod** schemas.
   - Infer TypeScript interfaces directly from schemas (`z.infer<typeof UserSchema>`).
   - Simulate realistic edge cases: Network latency (`delay(500)`), 401 Unauthorized, 422 Validation Errors, and 500 Internal Server Errors to verify frontend UI resilience.
