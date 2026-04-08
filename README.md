# Jolly Web App

Jolly Web App is a full-stack multiplayer score-tracking app with lobbies, live game updates, and game history.

## Project Structure

```
.
├── frontend/   # React + TypeScript + Vite client
├── backend/    # Node.js + Express API
├── docker-compose.yml
└── docker-compose.dev.yml
```

## Frontend

- Stack: React 19, TypeScript, Vite, TanStack Router, TanStack Query
- Main entry: `frontend/src/App.tsx`
- Routing: `frontend/src/routes/*`
- API client: `frontend/src/core/api/client.ts`
- Default local URL: `http://localhost:5173`
- Production build in Docker is served on port `3500`

### Frontend Commands

From `frontend/`:

```bash
npm install
npm run dev
```

Optional:

```bash
npm run build
npm run preview
npm run storybook
```

## Backend

- Stack: Node.js, Express, MongoDB, Mongoose
- Server entry: `backend/server.js`
- Routes: `/users`, `/api/lobbies`, `/api/games`, `/admin`
- Default API URL: `http://localhost:3501`
- Uses cookie-based auth/session plus `x-session-id` support

### Backend Commands

From `backend/`:

```bash
npm install
npm start
```

Required environment variables:

- `MONGODB_URI`
- `SESSION_SECRET`
- `NODE_ENV`

## Running with Docker

This repo includes Docker Compose setups:

- `docker-compose.yml`: full stack (frontend + backend + MongoDB + mongo-express)
- `docker-compose.dev.yml`: backend + MongoDB + mongo-express (frontend runs locally with Vite)

Run:

```bash
docker compose up --build
```

For dev backend stack only:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Default ports:

- Frontend (containerized): `3500`
- Backend API: `3501`
- MongoDB: `27017`
- Mongo Express: `8081`

## Local Development Flow

1. Start backend and MongoDB (Docker Compose or local Mongo).
2. Start frontend with `npm run dev` in `frontend/`.
3. Ensure frontend can reach backend.
4. Local Vite frontend usually uses `http://localhost:3501`.
5. In containers, frontend can use `http://backend:3501`.
