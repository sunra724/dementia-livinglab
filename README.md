# Dementia Living Lab Dashboard

Integrated dashboard for managing the full six-step dementia care living-lab process:

1. Preparation
2. Problem Definition
3. Ideation
4. Prototype
5. Test
6. Diffusion

The app includes:

- Public dashboards for participants, workshops, worksheets, KPI, budget, promotion, safety, and guidebook progress
- Admin pages for operational updates
- Public worksheet submission links with token-based access
- Postgres-backed data storage for Vercel deployments
- Vercel Blob-backed field photo uploads

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Postgres via `postgres`
- Vercel Blob via `@vercel/blob`
- SWR
- Recharts

## Local Run

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Useful checks:

```bash
cmd /c npx tsc --noEmit
cmd /c npm run lint
cmd /c npm run build
```

## Environment Variables

Required:

```bash
ADMIN_TOKEN=livinglab2026
POSTGRES_URL=postgres://...
```

Optional:

```bash
DATABASE_URL=postgres://...      # used when POSTGRES_URL is not set
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ANTHROPIC_API_KEY=sk-ant-...
```

Database priority:

- `POSTGRES_URL` takes precedence
- `DATABASE_URL` is used as a fallback

Photo upload behavior:

- When `BLOB_READ_WRITE_TOKEN` is set, photos are stored in Vercel Blob
- Without that token, local development stores photos under `public/uploads/photos`

## Seed Data

The app auto-creates Postgres tables and seed data on first access through the API layer.

Manual seed command:

```bash
npm run db:seed
```

## Vercel Deployment

Recommended setup:

1. Import this GitHub repository into Vercel
2. Add a Vercel Marketplace Postgres provider, or connect any external Postgres database
3. Add Vercel Blob if field photo uploads should persist
4. Add environment variables:

```bash
ADMIN_TOKEN=your-secure-admin-token
POSTGRES_URL=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ANTHROPIC_API_KEY=sk-ant-... # only required for impact report generation
```

5. Deploy

Build settings:

- Framework Preset: Next.js
- Install Command: `npm install`
- Build Command: `npm run build`

Notes:

- Vercel does not provide a persistent writable project filesystem for serverless functions
- Do not use local SQLite or `public/uploads` for production persistence on Vercel
- The first API request initializes the schema and inserts demo seed data if the database is empty

## Main Routes

- `/` dashboard
- `/participants`
- `/workshops`
- `/worksheets`
- `/worksheets/[token]`
- `/kpi`
- `/budget`
- `/promotion`
- `/safety`
- `/guidebook`
- `/admin`

## Project Structure

Core app code lives in `src/`:

- `src/app` routes and API handlers
- `src/components` UI components
- `src/lib` database, schema, seed data, shared helpers
