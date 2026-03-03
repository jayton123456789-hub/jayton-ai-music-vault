# Jayton AI Music Vault

Part 1 and Part 2 of the premium music portal. This is a Next.js 14+ TypeScript app-router project with Tailwind, Prisma + SQLite auth, server-issued `vault_session` cookies, middleware-protected routes, a polished dark glass UI, and a Suno-inspired upload and playback flow.

## Features

- `/login` identity cards for Jayton, Dillon, and Nick with a passcode modal flow
- `POST /api/auth/login` validates bcrypt passcode hashes from SQLite via Prisma
- `POST /api/auth/logout` clears the secure httpOnly `vault_session` cookie
- `GET /api/auth/me` returns the current authenticated user
- Middleware protection for `/home`, `/library`, `/uploads`, `/favorites`, and `/videos`
- Personalized favorites tabs: the active user sees `My Favorites` plus everyone else's named favorites tabs
- `POST /api/tracks/upload` accepts multipart uploads, stores audio files, extracts embedded cover art when present, and creates a `Track` record
- `GET /api/tracks` returns all published tracks newest first
- `GET /api/tracks/new` returns recent uploads for the home and uploads experiences
- `/uploads` provides a Suno-style studio UI with drag-and-drop upload, lyrics, style, tags, and live preview
- `/library` shows published track cards with art, tags, and HTML5 audio playback
- `/home` features the newest uploads as large hero cards
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

## Part 2 Usage

- Sign in as `jayton` to enable uploads. Other users can open `/uploads`, but the form is intentionally disabled.
- Accepted upload formats: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, and `.flac`
- Uploaded audio files are written to `public/uploads/audio`
- Extracted embedded covers are written to `public/uploads/covers`
- If no embedded cover is found, the app generates a gradient SVG placeholder automatically
- Uploaded tracks appear in `/library` and recent uploads are highlighted on `/home`

## Notes

- The cookie is always `httpOnly` and `sameSite=lax`.
- The `secure` flag is enabled automatically in production so local HTTP development still works.
- Replace `SESSION_SECRET` with a strong value before deploying.
