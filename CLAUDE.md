# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Italian train timetable PWA ("Orari Treni") — real-time departures, arrivals, train status tracking, and journey search for Trenitalia. React + TypeScript frontend with an Express proxy server. Supports Italian, English, and Russian.

## Commands

- **Dev (full stack):** `npm run dev` — runs Express server (port 3001) and Vite dev server concurrently
- **Dev (client only):** `npm run dev:client` — Vite only (needs proxy server separately)
- **Dev (server only):** `npm run dev:server` — Express proxy only
- **Build:** `npm run build` — TypeScript check + Vite build to `dist/`
- **Production:** `npm start` — serves built frontend + API proxy from Express
- **Lint:** `npx eslint .`
- **Type check:** `npx tsc -b`

No test framework is configured.

## Architecture

### Two-tier proxy setup

The app talks to two external Trenitalia APIs, both proxied to avoid CORS:

1. **ViaggiaTreno API** (`/api/*` → `viaggiatreno.it`) — station autocomplete, departures, arrivals, train status. Proxied by Express server in dev/prod and by Vite dev proxy in dev mode.
2. **Trenitalia BFF** (journey solutions) — two proxy paths:
   - **Express server** (`/bff/*` → `lefrecce.it`) — handles Akamai bot protection via session cookie management (refresh every 25 min, auto-retry on 403).
   - **Cloudflare Worker** (`worker/`) — lightweight CORS proxy at `orari-treni-bff.alessandro-000.workers.dev`, used directly by the client for journey search (`searchSolutions` in `viaggiatreno.ts`).

### Frontend structure

- `src/App.tsx` — root component with three views (`stazione`, `treno`, `viaggio`) controlled by bottom nav
- `src/api/viaggiatreno.ts` — all API calls to ViaggiaTreno and Trenitalia BFF
- `src/i18n.ts` — custom i18n system (no library). Translations are inline objects keyed by `Lang` type. `t('key')` function for translation. Language detection: localStorage → browser locale → English fallback.
- `src/types/index.ts` — shared TypeScript interfaces
- `src/components/` — StationSearch, DepartureBoard, TrainRow, TrainSearch, JourneySearch
- `src/styles/app.css` — single CSS file for all styles

### Key patterns

- Station codes follow Trenitalia format (e.g., `S01700` for Milano Centrale). The `stationCodeToLocationId` function converts these to numeric IDs for the BFF API by stripping the `S` prefix and prepending `8300`.
- ViaggiaTreno API uses a custom date format (`"Mon Jan 01 2024 08:00:00 GMT+0100"`) — see `formatDateForApi`.
- The `compRitardo` array from ViaggiaTreno contains delay descriptions in 9 languages at fixed indices (0=it, 1=en, 2=de, ... 8=ru).
- All time formatting uses `toLocaleTimeString` with locale from `getTimeLocale()`.

### Deployment

Deployed on Render (see `render.yaml`). Build: `npm install && npm run build`, start: `npm start`. The Cloudflare Worker is deployed separately via `wrangler`.
