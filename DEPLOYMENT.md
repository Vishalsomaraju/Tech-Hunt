# TECH HUNT — Deployment Guide

## Architecture

| Component | Technology          | Host                        |
| --------- | ------------------- | --------------------------- |
| Client    | React 19 + Vite     | Vercel (or any static host) |
| Server    | Express + Socket.io | Railway / Render / Heroku   |
| Database  | PostgreSQL 15+      | Neon / Supabase / Railway   |

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database with SSL enabled
- **npm** (workspace-aware)

---

## 1. Database Setup

```bash
# From project root
cd server

# Copy and fill in your .env
cp .env.production.example .env

# Initialize schema
npx tsx src/db/init.ts

# Run migrations (idempotent — safe to re-run)
npx tsx src/db/migrate.ts
```

---

## 2. Server Deployment

### Environment Variables

| Variable       | Required | Description                                          |
| -------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL` | ✅       | PostgreSQL connection string with `?sslmode=require` |
| `JWT_SECRET`   | ✅       | Random string, minimum 32 characters                 |
| `PORT`         |          | HTTP port (default: `3001`)                          |
| `CORS_ORIGIN`  | ✅       | Client URL (e.g. `https://techhunt.vercel.app`)      |
| `NODE_ENV`     | ✅       | Must be `production`                                 |

### Build & Start

```bash
cd server
npm install --production
npm run build      # compiles TypeScript → dist/
npm start          # runs dist/index.js
```

### Heroku

```bash
cd server
heroku create techhunt-api
heroku addons:create heroku-postgresql:mini
heroku config:set NODE_ENV=production JWT_SECRET=... CORS_ORIGIN=...
git push heroku main
```

The `Procfile` is already configured: `web: node dist/index.js`

### Railway / Render

Set the build command to `npm run build` and start to `npm start`. Add all environment variables from the table above.

---

## 3. Client Deployment

### Environment Variables

| Variable          | Required | Description                                                                                   |
| ----------------- | -------- | --------------------------------------------------------------------------------------------- |
| `VITE_API_URL`    |          | API base URL. Default: `/api` (for same-origin proxy). Set to full URL if hosting separately. |
| `VITE_SOCKET_URL` |          | WebSocket URL. Leave empty for same origin. Set to server URL if hosting separately.          |

### Vercel

```bash
cd client
vercel --prod
```

The `vercel.json` is already configured with SPA rewrites and asset caching.

### Manual Build

```bash
cd client
npm run build
# Serve dist/ with any static file server (nginx, caddy, etc.)
```

---

## 4. Verify Deployment

1. Open the client URL
2. Register an account
3. Create a game and verify you reach the lobby
4. Check the server logs for `🏗️ TECH HUNT Server` startup banner
5. Visit `/api/health` — should return `{ status: "ok" }`

---

## Troubleshooting

| Issue                       | Solution                                                                          |
| --------------------------- | --------------------------------------------------------------------------------- |
| CORS errors                 | Ensure `CORS_ORIGIN` matches the client URL exactly (no trailing slash)           |
| WebSocket fails             | Verify `VITE_SOCKET_URL` is set to the server URL, or leave blank for same-origin |
| 401 on all API calls        | Check `JWT_SECRET` is set and matches in both build and runtime                   |
| Database connection timeout | Ensure `DATABASE_URL` includes `?sslmode=require` for cloud databases             |
