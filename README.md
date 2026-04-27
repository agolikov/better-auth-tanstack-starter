# TanStack Start Starter (Extended)

A bit extended TanStack Start starter with integrated Cloudflare R2 storage, Resend email, and Google Sign-In — plus PostgreSQL, Better Auth, and Drizzle ORM out of the box.

## Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR, Nitro v2) |
| Auth | [Better Auth](https://www.better-auth.com/) — email/password + Google OAuth |
| Database | PostgreSQL via [Drizzle ORM](https://orm.drizzle.team/) (Neon recommended) |
| Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) — presigned upload/download URLs |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Linting | [Biome](https://biomejs.dev/) |

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```env
# Auth
BETTER_AUTH_SECRET="generate with: openssl rand -hex 32"

# Database (Neon or any Postgres)
DATABASE_URL="postgresql://..."

# Google OAuth — https://console.cloud.google.com
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Cloudflare R2 — https://dash.cloudflare.com → R2 → Manage API tokens
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET_NAME=""
```

### 3. Initialize the database

Push the schema to your database (creates all tables):

```bash
pnpm db:push
```

### 4. Start the dev server

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Database commands

| Command | Description |
|---|---|
| `pnpm db:push` | Push schema changes directly to the database (dev) |
| `pnpm db:generate` | Generate SQL migration files |
| `pnpm db:migrate` | Apply generated migrations |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |

The schema is defined in [`auth-schema.ts`](./auth-schema.ts). After any schema change, run `pnpm db:push` (dev) or `pnpm db:generate && pnpm db:migrate` (prod).

---

## Auth

Routes under `/auth/$path` handle both sign-in and sign-up on a single page with a toggle.

**Google OAuth** — set the authorized redirect URI in your Google Cloud Console:
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

The auth config lives in [`src/lib/auth.ts`](./src/lib/auth.ts). The client helper is in [`src/lib/auth-client.ts`](./src/lib/auth-client.ts).

---

## Storage API

Two server endpoints handle presigned URLs for Cloudflare R2. Both require an active session.

### Upload URL

```
POST /api/storage/upload-url
Content-Type: application/json

{ "key": "uploads/file.png", "contentType": "image/png" }
```

Response: `{ "url": "https://...", "key": "uploads/file.png" }`

Upload the file directly from the client with a `PUT` request to the returned `url`.

### Download URL

```
GET /api/storage/download-url?key=uploads/file.png
```

Response: `{ "url": "https://..." }`

Both URLs expire after **1 hour**.

---

## Project structure

```
src/
├── components/
│   ├── header.tsx
│   ├── providers.tsx
│   └── ui/
├── database/
│   └── db.ts           # Drizzle client
├── lib/
│   ├── auth.ts         # Better Auth server config
│   ├── auth-client.ts  # Better Auth client helper
│   └── storage.ts      # Cloudflare R2 client
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── api/
│   │   ├── auth/$.ts           # Better Auth handler
│   │   └── storage/
│   │       ├── upload-url.ts
│   │       └── download-url.ts
│   ├── auth/$path.tsx           # Sign-in / Sign-up page
│   └── account/$path.tsx
auth-schema.ts          # Drizzle schema (users, sessions, accounts, verifications)
drizzle.config.ts
```

---

## Build

```bash
pnpm build
pnpm serve
```

Deploys to Vercel by default (configured via `nitroV2Plugin({ preset: "vercel" })`). Change the preset in [`vite.config.ts`](./vite.config.ts) to target other platforms (Cloudflare Workers, Node, etc.).
