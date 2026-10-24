# notchi-web

Download website for [Notchi](https://github.com/risuunava/Notchi), a native notch overlay for
Windows 10/11. The site is fully static: release metadata is fetched from the GitHub Releases API at
build time, and download buttons link straight to GitHub.

## Stack

- [Astro](https://astro.build) (static output) + TypeScript (strict)
- Tailwind CSS v4 via `@tailwindcss/vite`
- `marked` + `sanitize-html` for release notes, `semver` for version sorting
- Vitest, ESLint, Prettier
- Deployed on Vercel

## Development

Requirements: Node.js `>=22.23.4` (see `.nvmrc`), npm.

```sh
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the dev server             |
| `npm run build`     | Build the static site to `dist/` |
| `npm run preview`   | Preview the production build     |
| `npm run check`     | Typecheck + lint + tests         |
| `npm run typecheck` | `astro check`                    |
| `npm run lint`      | ESLint                           |
| `npm run format`    | Format with Prettier             |
| `npm run test`      | Run Vitest once                  |

## Environment variables

| Variable       | Required | Description                                                         |
| -------------- | -------- | ------------------------------------------------------------------- |
| `GITHUB_TOKEN` | No       | Read-only token to raise the GitHub API rate limit                  |
| `GITHUB_OWNER` | No       | Repository owner, defaults to `risuunava`                           |
| `GITHUB_REPO`  | No       | Repository name, defaults to `Notchi`                               |
| `SITE_URL`     | No       | Canonical site URL, defaults to `https://notchi-web-tau.vercel.app` |

Never commit real tokens. On Vercel, set these in Project Settings → Environment Variables.
`SITE_URL` must be the exact production domain (no trailing slash), otherwise canonical links,
Open Graph URLs, the sitemap and the RSS feed will point at the wrong host.

## Deploy

Import the repository into Vercel with the Astro preset. Build command `npm run build`, output
directory `dist`. A deploy hook can be triggered from the Notchi repository whenever a release is
published, and a scheduled workflow keeps download counts fresh.

### Automation setup

These steps live in the Vercel dashboard and the Notchi repository, so they cannot be done from this
repository:

1. **Vercel environment variables** (Production and Preview): `GITHUB_TOKEN` (read-only),
   `GITHUB_OWNER`, `GITHUB_REPO`, and `SITE_URL` set to the live production URL.
2. **Create a deploy hook**: Vercel → Project → Settings → Git → Deploy Hooks, branch `main`.
   Copy the URL.
3. **Scheduled rebuild**: add the deploy hook URL as the `VERCEL_DEPLOY_HOOK_URL` secret in this
   repository (Settings → Secrets and variables → Actions). `.github/workflows/scheduled-rebuild.yml`
   calls it daily at 03:00 UTC and can also be run manually from the Actions tab.
4. **Release notifications**: add `.github/workflows/notify-website.yml` to the **Notchi** repository
   (not this one) and store the same hook URL as `VERCEL_DEPLOY_HOOK_URL` there:

   ```yaml
   name: Notify website

   on:
     release:
       types: [published, edited, deleted]

   jobs:
     trigger:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Vercel deploy hook
           env:
             DEPLOY_HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
           run: |
             if [ -z "$DEPLOY_HOOK_URL" ]; then
               echo "::error::VERCEL_DEPLOY_HOOK_URL secret is not set"
               exit 1
             fi
             curl -fsS -X POST "$DEPLOY_HOOK_URL"
   ```

5. **End-to-end check**: publish a pre-release on GitHub, wait for the deploy, then confirm it shows
   up on `/download/` (enable "Show pre-releases"). Delete the test release when done.
6. **Custom domain** (optional): add it in Vercel → Project → Settings → Domains, then update
   `SITE_URL` to match and redeploy.

## Repository layout

```text
src/site.config.ts   Site metadata, GitHub source, asset classification rules
src/lib/             Data layer: GitHub fetch, asset/version parsing, formatting, markdown
src/i18n/            English and Indonesian dictionaries
src/layouts/         Base layout
src/components/      Shared UI
src/pages/           Routes (English without prefix, Indonesian under /id)
tests/               Unit tests and fixtures
```

`PLAN.md` is a local planning document and is intentionally git-ignored.
