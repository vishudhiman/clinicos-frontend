# ClinicOS Frontend

Next.js (App Router) patient chat, patient portal, and staff dashboard for ClinicOS.
Talks only to the [clinicos-backend](../clinicos-backend) API — this app never touches
Postgres directly, including for auth (Auth.js's Credentials/Google providers call the
backend's `/auth/*` endpoints instead of a database adapter).

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend, generate AUTH_SECRET
npm run dev
```

Requires [clinicos-backend](../clinicos-backend) running (defaults to `http://localhost:4002`).

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 33
```

Google sign-in (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) is optional — the login/signup
pages only show the "Continue with Google" button when both are set.

## Structure

```text
app/
  (patient)         AI Assistant, My Appointments, Find a Doctor, Notifications, Profile
  dashboard/ appointments/ doctors/   staff-only (role-gated in proxy.ts)
  login/ signup/
  api/auth /register /profile         thin routes — all proxy to the backend, no DB access
components/
  layout/           app shell, sidebar (staff) / bottom nav (patient), notification bell
  auth/ appointments/ dashboard/ chat/
auth.ts             Auth.js config (Credentials + optional Google), JWT session strategy
proxy.ts            route protection + role-based redirects (Next.js 16 renamed
                     middleware.ts to proxy.ts, defaults to the Node.js runtime)
```
