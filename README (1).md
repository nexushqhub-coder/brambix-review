# Brambix Review — Installable Dashboard

A small app for reviewing everything that needs your attention: escalated
Character Masters, escalated pages, escalated custom scripts, and orders
whose final PDF is ready to email.

## Deploy free on GitHub Pages

1. Create a new **public** GitHub repo (e.g. `brambix-review`).
   (Public is required for GitHub Pages on a free account — there's no
   sensitive data in these files themselves, just the app shell. The
   n8n URL is already public-facing since it's a webhook.)

2. Upload all files in this folder to the repo:
   `index.html`, `style.css`, `app.js`, `config.js`, `manifest.json`,
   `service-worker.js`, `icon-192.png`, `icon-512.png`.

3. Go to the repo's **Settings → Pages**.

4. Under **Source**, select **Deploy from a branch** → Branch: `main` →
   Folder: `/ (root)` → **Save**.

5. GitHub gives you a URL like:
   `https://yourusername.github.io/brambix-review/`

   Wait 1–2 minutes for the first deploy.

## Install it on your phone

1. Open the GitHub Pages URL in your phone's browser (Chrome on Android,
   Safari on iOS).
2. **Android (Chrome):** tap the menu (⋮) → "Add to Home screen" (or
   Chrome may prompt you automatically).
3. **iPhone (Safari):** tap the Share icon → "Add to Home Screen".
4. It now behaves like a real app — its own icon, opens full-screen.

## Before it works

Open `config.js` and confirm the URL matches your n8n instance:

```js
const N8N_BASE = "https://tejpratap.app.n8n.cloud/webhook";
```

Make sure Workflow 1's Section G (`GET /escalations`) is **published**
(active) in n8n, same as your other production webhooks.

## What each section shows

| Section | Source | Actions |
|---|---|---|
| Character Masters | CM records with status = Escalated | Approve / Retry (calls `/character-decision`) |
| Pages | Pages with illustration_qc_status = Escalated | Read-only for now — regenerate manually in Airtable |
| Custom Scripts | Orders with story_outline_status = Retry Exhausted | Approve / Retry (calls `/script-decision`) |
| Ready to Send | Deliveries with delivery_status = Manual QC | Links to the Drive PDF and Cloudinary preview |

The app polls for updates every 60 seconds, or tap the refresh icon
anytime.

## A note on the "Pages" section

There's currently no single-page manual retry endpoint — escalated pages
need a fix directly in Airtable (adjust the prompt/reference, flip
artwork_status back to "Generate", re-run `/produce-book`). This can be
added as a future enhancement if it comes up often enough to be worth
a dedicated action.
