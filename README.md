# Identity Service

A robust TypeScript Node.js microservice for authentication, claims-based authorization, and JWT token issuance built with **Fastify**, **TypeORM**, **SQLite**, **bcrypt**, and **jsonwebtoken**.

## Ecosystem Context

This service acts as the central authentication & authorization (identity) provider for the **Personal Finance Tracker** ecosystem. It provides secure user registration, login, JWT issuance, and token verification for:
- [personal-finance-tracker-be](https://github.com/alfedalinan/personal-finance-tracker-be) — Backend API service
- [personal-finance-tracker-fe](https://github.com/alfedalinan/personal-finance-tracker-fe) — Frontend web application

---

## Current State & Recent Progress

Recent engineering iterations and architectural refinements include:
- **`tenantId` Support**: Added `tenantId` field to the User entity and ensured it is correctly included in JWT claims upon login.
- **Auto-Incrementing User ID Migration**: Migrated `user.id` from UUID to an auto-incrementing integer identifier for streamlined entity referencing.
- **Enhanced JWT Security (`iss` & `aud`)**: Configured issuer (`iss`) and audience (`aud`) claims in JWT token issuance and verification.
- **Environment Configuration Loading Fixes**: Resolved configuration loading order issues to ensure environment variables and configurations are fully loaded before application startup.

---

## Architecture & Tech Stack

- **Framework**: [Fastify](https://www.fastify.io/) for fast, low-overhead HTTP routing and request validation.
- **Database & ORM**: [TypeORM](https://typeorm.io/) with [SQLite](https://www.sqlite.org/) (`database.sqlite`) for lightweight persistent storage.
- **Security**: 
  - `bcrypt` for salted password hashing.
  - `jsonwebtoken` for cryptographically signed JWT access tokens.
  - `@fastify/rate-limit` for rate limiting (global and auth route protection).

---

## Features

- **User Authentication**: Secure registration and login with salted password hashing.
- **Claims & Roles Integration**: Embeds user roles and custom JSON claims directly into issued JWT access tokens.
- **Token Verification**: Endpoint to validate access tokens and inspect decoded claims.
- **Rate Limiting**: Built-in rate limiting (global limit of 100 requests/minute, with stricter limits of 10 requests/minute on authentication endpoints like login and register).
- **Fast & Lightweight**: Powered by Fastify and SQLite.

---

## Environment Variables

Create a `.env` file in the root directory (or set environment variables in your deployment environment) with the following options:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | The port on which the Fastify server listens | `3000` |
| `HOST` | The host interface to bind to | `0.0.0.0` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `super-secret-identity-key-change-in-production` |

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

```bash
npm install
```

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

---

## API Endpoints

### 1. Health Check
- **GET `/health`**
- **Response**: `{"status": "ok", "service": "identity-service", ...}`

### 2. Register User
- **POST `/api/auth/register`**
- **Body**:
  ```json
  {
    "username": "alice",
    "password": "securepassword123",
    "roles": ["admin", "user"],
    "claims": {
      "tenantId": "tenant-xyz",
      "department": "engineering"
    }
  }
  ```

### 3. Login & Get Access Token
- **POST `/api/auth/login`**
- **Body**:
  ```json
  {
    "username": "alice",
    "password": "securepassword123"
  }
  ```
- **Response**: Returns a signed JWT access token containing `sub`, `username`, `roles`, and all custom claims (`tenantId`, `department`, etc.).

### 4. Verify Access Token
- **GET `/api/auth/verify`**
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: Returns validation status and decoded token payload.
