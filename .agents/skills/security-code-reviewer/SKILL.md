---
name: security-code-reviewer
description: Security review specialist for frontend and web applications. Use when auditing Cross-Site Scripting (XSS), Content Security Policy (CSP), secret leakage in client bundles, CORS misconfigurations, and running dependency vulnerability scans.
---

# Frontend Security & Vulnerability Reviewer Skill

## Threat Vectors & Auditing Rules

### 1. Cross-Site Scripting (XSS)
- **Direct HTML Injection**: Flag and replace all instances of `dangerouslySetInnerHTML`, `v-html`, or `innerHTML` unless sanitized via strict HTML sanitizers like `DOMPurify` (`DOMPurify.sanitize(...)`).
- **URL Schemes**: Audit all `href` and `src` bindings against `javascript:` pseudo-protocol injection. Validate that links adhere to `http://`, `https://`, or `mailto:`.
- **Target `_blank`**: Ensure all external links using `target="_blank"` include `rel="noopener noreferrer"` to prevent Tabnabbing.

### 2. Client-Side Secret Leakage
- Audit environment variables: Ensure API private keys, database passwords, and webhook secrets are NEVER prefixed with public prefixes like `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_`.
- Inspect build outputs to guarantee `.env` secrets are not bundled into client JavaScript.

### 3. Open Redirects & iframe Embedding
- Validate redirect URL parameters before navigating (`window.location.href = redirectUrl`).
- Verify `X-Frame-Options` / CSP `frame-ancestors` headers to prevent Clickjacking.

### 4. Dependency Security Scans
- Run automated package audits (`npm audit --audit-level=high` / `pnpm audit`).
- Identify unmaintained, malicious, or vulnerable transitive dependencies.
