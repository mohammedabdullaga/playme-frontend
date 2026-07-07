# Proxy Management Panel Backend

A clean Node.js + Express + SQLite backend for managing proxies, shared-credential users, and Cloudflare DNS records.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and configure values:
   ```bash
   cp .env.example .env
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Environment variables

- PORT
- JWT_SECRET
- ADMIN_USER
- ADMIN_PASS
- CF_API_TOKEN
- CF_ZONE_ID
- BASE_DOMAIN

## API endpoints

### Auth
- POST /api/auth/login

### Proxies
- GET /api/proxies
- POST /api/proxies
- PUT /api/proxies/:id
- DELETE /api/proxies/:id

### Users
- GET /api/users
- POST /api/users
- GET /api/users/:id/config
- POST /api/users/:id/disable
- POST /api/users/:id/reactivate

### Health
- GET /health
