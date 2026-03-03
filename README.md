# Jayton AI Music Vault

Part 1 of the premium music portal. This is a Next.js 14+ TypeScript app-router project with Tailwind, Prisma + SQLite auth, server-issued `vault_session` cookies, middleware-protected routes, and a polished dark glass UI for login and the authenticated shell.

## Features

- `/login` identity cards for Jayton, Dillon, and Nick with a passcode modal flow
- `POST /api/auth/login` validates bcrypt passcode hashes from SQLite via Prisma
- `POST /api/auth/logout` clears the secure httpOnly `vault_session` cookie
- `GET /api/auth/me` returns the current authenticated user
- Middleware protection for `/home`, `/library`, `/uploads`, `/favorites`, and `/videos`
- Personalized favorites tabs: the active user sees `My Favorites` plus everyone else’s named favorites tabs
- Seed script for local development users:
  - `jayton` = `1987`
  - `dillon` = `3141`
  - `nick` = `3141`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Push the Prisma schema to the local SQLite database:

```bash
npm run db:push
```

4. Seed the default users:

```bash
npm run db:seed
```

## Run

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Validation

Run the checks locally:

```bash
npm run lint
npm run build
```

## Notes

- The cookie is always `httpOnly` and `sameSite=lax`.
- The `secure` flag is enabled automatically in production so local HTTP development still works.
- Replace `SESSION_SECRET` with a strong value before deploying.
