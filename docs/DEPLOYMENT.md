# Deployment and branches (Vercel)

## Branches

| Branch | Role |
|--------|------|
| **`main`** | Integration branch. Everyone creates feature branches **from `main`** and opens pull requests **into `main`**. |
| **`live`** | **Production** branch. What Vercel should deploy as your public site. Merge `main` → `live` when you are ready to ship. |

Suggested flow:

1. `git checkout main && git pull`
2. `git checkout -b feature/short-description`
3. Work, commit, push, open PR **into `main`**
4. After review, merge into `main`**
5. When the team wants that code on the live site: merge **`main` into `live`** (or open a PR `main` → `live`).

Keep `live` stable: only promote tested work from `main`.

## Vercel (already linked)

This repo is connected to a Vercel project named **`foresight-web`**.

Production URL (stable alias from the latest production deployment):

- **https://foresight-web.vercel.app**

Per-deployment URLs also appear in the [Vercel dashboard](https://vercel.com/dashboard) for each deploy.

### Required: production branch = `live`

By default, new Git projects often use **`main`** as the production branch. Set it to **`live`** so only promoted code goes live:

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your team → project **foresight-web**
2. **Settings** → **Git**
3. **Production Branch** → set to **`live`**
4. Save

After this, pushes to **`live`** (and merges into `live`) update production; pushes to **`main`** generate **preview** deployments if previews are enabled (default for Git integration).

### CLI deploys (optional)

From the repo root, with the Vercel CLI logged in:

```bash
npx vercel deploy --prod
```

Git-based deploys are usually enough for the team; use the CLI when you need a manual production deploy from your machine.

## Build check locally

```bash
npm install
npm run build
```
