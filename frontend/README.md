# University Payment System — Frontend Demo

A minimal static frontend (vanilla HTML/CSS/JS, no build step) that exercises the
[University Payment System](../README.md) API end to end: register/login, browse
registration cycles, select subjects, calculate fees, authorize a payment with fake
banking details, then capture/cancel/refund it.

This exists purely to give the backend project a clickable live demo — it is not meant
to reflect a production university UI.

## Running locally

1. Start the backend (see the root `README.md`), then run `npm run seed` once to create
   the demo registration cycle and seeded student accounts.
2. Edit `config.js` and point `API_BASE_URL` at your running backend
   (e.g. `http://localhost:5000`).
3. Serve this folder with any static server, e.g.:
   ```bash
   npx serve .
   ```
4. Log in with a seeded demo account, e.g. student number `STU001`, email
   `john.doe@student.university.ac.za` — or register a new one.

## Deploying

Any static host works (GitHub Pages, Netlify, Vercel). After deploying:

1. Set `API_BASE_URL` in `config.js` to the deployed backend's URL, then redeploy.
2. Set the backend's `FRONTEND_URL` environment variable to this frontend's deployed
   origin, so CORS allows it.

## Note on banking details

This demo accepts any values for banking details — they are encrypted at rest by the
backend (AES-256-GCM) exactly like production data would be, but no real payment
gateway is called. Do not enter real account details.
