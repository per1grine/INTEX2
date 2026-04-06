# INTEX2 – PERN-style starter (Postgres + React) with .NET 10 API

This repo contains:

- `backend/` – .NET 10 Web API (JWT auth + EF Core + Postgres)
- `frontend/` – Vite + React + TypeScript UI (Home/Login/Register/Welcome)

## Backend setup

### 1) Configure Postgres connection + JWT key

Edit `backend/IntexApi/appsettings.json`:

- `ConnectionStrings:Default`: set Host/Database/Username/Password for your local Postgres
- `Jwt:Key`: set to a long random secret

You can also set the connection string via environment variable instead of editing JSON:

- `ConnectionStrings__Default="Host=...;Port=5432;Database=...;Username=...;Password=..."`

### 2) Create the DB tables

From the repo root:

```bash
dotnet ef database update --project backend/IntexApi/IntexApi.csproj
```

### 3) Run the API

```bash
dotnet run --project backend/IntexApi/IntexApi.csproj
```

The API runs on `http://localhost:5178` by default (see `launchSettings.json`).
The API runs on `http://localhost:5180` by default (see `launchSettings.json`).

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)

## Frontend setup

### 1) Install + run

```bash
cd frontend
npm install
npm run dev
```

Frontend uses `VITE_API_URL` (see `frontend/.env`) and expects the API at `http://localhost:5180`.

## Database scripts (npm)

These scripts are run from **`frontend/`** and use `frontend/.env` `DATABASE_URL`:

- `npm run db:reset` – drops/recreates the `public` schema (wipes all data)
- `npm run db:setup` – creates required tables/indexes (`Users`)
- `npm run db:seed` – inserts a couple test users

Example `DATABASE_URL`:

```text
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/intex
```

