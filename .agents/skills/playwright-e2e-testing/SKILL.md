---
name: playwright-e2e-testing
description: Generates, debugs, and maintains robust Playwright End-to-End (E2E) and component tests. Use when creating browser tests, automating user flows, asserting accessibility, configuring Page Object Models (POM), and debugging flaky tests.
---

# Playwright E2E Testing Specialist Skill

## Locator Hierarchy & Resilience
Always select elements using user-facing attributes and accessibility roles rather than fragile CSS classes or XPath:
1. **Best**: `page.getByRole('button', { name: /submit/i })`, `page.getByRole('heading', { level: 1 })`
2. **Text / Label**: `page.getByLabel('Username')`, `page.getByPlaceholder('name@example.com')`, `page.getByText('Success')`
3. **Explicit Test ID**: `page.getByTestId('cart-item-row')` (when accessibility roles are ambiguous)
4. **Avoid**: `page.locator('.btn-primary > span')` or arbitrary XPath strings.

## Test Structure & Page Object Model (POM)
- Encapsulate page navigation and action sequences in dedicated classes / helper fixtures.
- Keep tests declarative:
  ```typescript
  test('user can complete checkout', async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.fillShippingDetails({ name: 'Alice', zip: '12345' });
    await checkoutPage.submit();
    await expect(page.getByText('Order confirmed')).toBeVisible();
  });
  ```

## Assertions & Flakiness Prevention
- **Web-First Assertions**: Always use `await expect(locator).toBeVisible()`, `await expect(locator).toHaveText(...)` which automatically retry until timeout.
- **Never use hardcoded sleeps**: Never use `page.waitForTimeout(3000)`. Instead use `page.waitForResponse(...)`, `page.waitForURL(...)`, or assert condition on UI element state.
- **Network Isolation**: Mock third-party APIs using `page.route()` to make test suites deterministic and fast.
