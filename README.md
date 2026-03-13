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
- SQLite-backed data storage with `better-sqlite3`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3`
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
```

Optional database configuration:

```bash
DATABASE_PATH=./data/livinglab.db
DATABASE_DIR=./data
```

Priority:

- `DATABASE_PATH` takes precedence
- if `DATABASE_PATH` is not set, `DATABASE_DIR` is used
- if neither is set, the app uses `./data/livinglab.db`

## Seed Data

The app auto-creates tables and seed data on first access through the API layer.

Manual seed command:

```bash
npm run db:seed
```

## Railway Deployment

For Railway, use a persistent volume for SQLite and point the database to that mounted path.

Recommended setup:

1. Create a Railway volume and mount it at `/data`
2. Add environment variables:

```bash
ADMIN_TOKEN=your-secure-admin-token
DATABASE_PATH=/data/livinglab.db
```

3. Deploy from GitHub or trigger a manual Railway deployment

Notes:

- Without a mounted volume, SQLite data will live on ephemeral container storage
- The project builds with `npm run build` and serves with `npm run start`

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
