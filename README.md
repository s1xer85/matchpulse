# MatchPulse

Never Miss a Match. A dark-mode-first PWA for following football clubs,
national teams, and competitions, with local-time match reminders.

Static hosting (GitHub Pages), no server, no exposed API key.

## Quick start (local)

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. The app reads `public/data/*.json` —
sample fixtures are already included so it works immediately.

## Deploy to GitHub Pages (from scratch)

1. **Create the repo**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: MatchPulse"
   git branch -M main
   git remote add origin https://github.com/<your-username>/matchpulse.git
   git push -u origin main
   ```

2. **Set the base path.** In `vite.config.ts`, `BASE_PATH` must match your
   repo name exactly, e.g. `/matchpulse/`. Already set correctly if you
   keep the repo named `matchpulse`.

3. **Get a free API-Football key**
   - Sign up at https://www.api-sports.io (free tier: 100 requests/day)
   - Copy your API key

4. **Add the key as a repo secret**
   - GitHub repo → Settings → Secrets and variables → Actions → New repository secret
   - Name: `API_FOOTBALL_KEY`, value: your key

5. **Enable GitHub Pages**
   - Settings → Pages → Build and deployment → Source: **GitHub Actions**

6. **Push (or manually trigger) the workflows**
   - `deploy.yml` runs automatically on every push to `main` and builds/publishes the site.
   - `update-data.yml` runs on a schedule (4x/day) and refreshes `public/data/*.json`.
   - You can trigger either manually: Actions tab → select workflow → "Run workflow".

7. **Visit your site**
   `https://<your-username>.github.io/matchpulse/`

### Verifying a deploy
Open the **Actions** tab — both "Refresh match data" and "Deploy to GitHub
Pages" should show a green check. If either is red, click into the run to
see the failing step (most common cause: missing/incorrect
`API_FOOTBALL_KEY` secret, or a `BASE_PATH` mismatch causing 404s on
assets).

## Architecture

```
API-Football (live data)
        |
        v
GitHub Action "Refresh match data" (runs 4x/day)
        |  fetches fixtures, writes JSON
        v
public/data/*.json   (committed into the repo)
        |
        v
GitHub Action "Deploy to GitHub Pages" (runs on every push)
        |  builds the React app, publishes it
        v
Live PWA at https://<username>.github.io/matchpulse/
```

## Tech stack

React 18 + TypeScript, Vite, Tailwind CSS, React Router (HashRouter),
IndexedDB via idb-keyval, vite-plugin-pwa, GitHub Pages + GitHub Actions.

## Notifications (v1 limitation)

Reminders use the browser's `Notification` API, scheduled client-side and
re-synced each time the app is opened. This works well for an installed
PWA you open regularly — it is **not** true push (won't fire if the app
has been fully closed for a long time). True push needs a small backend
(Firebase Cloud Messaging or a Cloudflare Worker + VAPID) — see "Planned"
below.

## Privacy

Favorites and notification preferences are stored only on-device
(IndexedDB). No accounts, no tracking, no ads, nothing sent to a server.

## Free-tier limits

| Source | Limit |
|---|---|
| API-Football free plan | 100 requests/day |
| This app's usage | ~2 requests/refresh × 4 refreshes/day |
| GitHub Pages | Free, unlimited for public repos |
| GitHub Actions | 2,000 free minutes/month |

## Planned / not yet built

- Search across clubs, players, competitions, stadiums
- Explore (trending matches, popular clubs, live section)
- Live match detail: timeline, commentary, xG (needs a richer data plan)
- Head-to-head / form / league position / lineups on Match Details
- Player following (currently clubs/national teams only)
- True push notifications (needs a small backend)
- Account/cloud sync across devices
- Homescreen widgets
- AI features: summaries, predictions, chat, voice search
- Admin panel
