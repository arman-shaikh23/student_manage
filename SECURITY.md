# SECURITY.md

## Overview
This document outlines the security architecture implemented in the SMSPro ERP System to protect data integrity, prevent unauthorized access, and mitigate common web vulnerabilities.

## 1. Authentication & Session Management
We have migrated away from LocalStorage-based long-lived tokens to a more secure **JWT PKI (Public Key Infrastructure) + Refresh Token Strategy**.

### Access Tokens (Short-Lived)
- **Format**: JSON Web Token (JWT)
- **Lifespan**: 15 minutes (`15m`).
- **Storage**: Stored in memory (React State / LocalStorage) on the frontend.
- **Purpose**: Sent via the `Authorization: Bearer <token>` header to authenticate API requests. Because of its short lifespan, if it is intercepted via XSS, the window of vulnerability is extremely small.

### Refresh Tokens (Long-Lived & Secure)
- **Format**: JSON Web Token (JWT)
- **Lifespan**: 7 days (`7d`).
- **Storage**: Sent to the client as an `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Purpose**: Used silently by the frontend Axios interceptor to request a new Access Token from `/api/auth/refresh` when the current Access Token expires.
- **Why?**: Since it is `httpOnly`, JavaScript cannot access it. This makes it immune to Cross-Site Scripting (XSS) attacks.

### Token Revocation (The `tokenVersion` Pattern)
Standard JWTs cannot be revoked without stateful blocklists. To solve this, we introduced the `tokenVersion` field in the Prisma `User` model.
- Every time a refresh token is issued, the user's current `tokenVersion` is embedded into the token payload.
- Upon using the refresh token, the backend compares the payload's `tokenVersion` with the database's `tokenVersion`.
- If an admin forces a logout, resets a password, or detects suspicious activity, they increment the user's `tokenVersion` in the database.
- **Result**: All previously issued refresh tokens become instantly invalid, effectively logging the user out across all devices.

## 2. Infrastructure Protections

### Helmet.js
We implemented `helmet` in `server.js` to automatically set secure HTTP headers.
- **Content-Security-Policy (CSP)**: Mitigates XSS by whitelisting sources of approved content.
- **X-Frame-Options**: Prevents Clickjacking by disallowing the site from being rendered in an iframe.
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections.
- **X-Content-Type-Options**: Prevents MIME-sniffing.

### Rate Limiting (DDoS Protection)
We implemented `express-rate-limit` on the `/api/auth/*` routes.
- Limited to **15 requests per 15 minutes** per IP.
- This prevents brute-force password attacks and credential stuffing on the `/login` endpoint.

### Cross-Origin Resource Sharing (CORS)
- Strict CORS rules are enforced. Only `http://localhost:5173` (Frontend) is allowed.
- `credentials: true` is enabled specifically to allow the `httpOnly` refresh token cookie to pass between the frontend and backend.

## 3. Data Protection
- **Passwords**: Hashed with `bcryptjs` using a minimum work factor of 10 rounds. Plaintext passwords are never logged or stored.
- **SQL Injection**: We use **Prisma ORM** for all database operations. Prisma uses parameterized queries by default, providing built-in protection against SQL Injection.

## 4. Input Validation & Sanitization
All API endpoints validate data using `express-validator`.
- Strict Regex validations are applied to fields like Phone Numbers and Student IDs.
- Future enhancement: implementing `xss-clean` middleware to aggressively sanitize deeply nested JSON bodies.
