# Identity Service

A robust TypeScript Node.js microservice for authentication, claims-based authorization, and JWT token issuance built with **Fastify**, **TypeORM**, **SQLite**, **bcrypt**, and **jsonwebtoken**.

## Features

- **User Authentication**: Secure registration and login with salted password hashing (`bcrypt`).
- **Claims & Roles Integration**: Embeds user roles and custom JSON claims directly into issued JWT access tokens.
- **Token Verification**: Endpoint to validate access tokens and inspect decoded claims.
- **Rate Limiting**: Built-in rate limiting using `@fastify/rate-limit` (global limit of 100 requests/minute, with stricter limits of 10 requests/minute on authentication endpoints like login and register).
- **Fast & Lightweight**: Powered by Fastify and SQLite.

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
