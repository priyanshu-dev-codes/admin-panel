# Raas~Rang Admin App

A standalone Vite + React admin frontend. It does not connect to Supabase directly and does not alter the database.

## Local setup
1. Install Node.js LTS.
2. Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the existing backend origin (no trailing slash).
3. `npm install`
4. `npm run dev`

## Deployment
Deploy this directory as a separate Cloudflare Pages project. Build command: `npm run build`; output directory: `dist`. Add `VITE_API_BASE_URL` as a Pages build environment variable. Use a dedicated admin hostname and HTTPS. Add the admin origin to backend CORS allowlist if the API enforces CORS.

## Auth caution
This first pass follows the existing x-api-key flow and keeps the key in sessionStorage for the browser tab. Use only an admin-scoped key, never a volunteer key. For production, prefer a short-lived server-side session / Supabase Auth and enforce admin role on every privileged endpoint. Never put SUPABASE_SERVICE_KEY in this frontend.

## Backend compatibility gate
The older AdminDashboard.tsx and admin-bookings endpoint use legacy field names and unsafe direct status changes. This starter intentionally supports read/list and CSV export only. Do not enable collection, cancellation, payment verification, hub/agent mutations until the backend endpoints are reconciled with the live schema and role authorization.
