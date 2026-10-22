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

| Variable       | Required | Description                                                     |
| -------------- | -------- | --------------------------------------------------------------- |
| `GITHUB_TOKEN` | No       | Read-only token to raise the GitHub API rate limit              |
| `GITHUB_OWNER` | No       | Repository owner, defaults to `risuunava`                       |
| `GITHUB_REPO`  | No       | Repository name, defaults to `Notchi`                           |
| `SITE_URL`     | No       | Canonical site URL, defaults to `https://notchi-web.vercel.app` |

Never commit real tokens. On Vercel, set these in Project Settings → Environment Variables.

## Deploy

Import the repository into Vercel with the Astro preset. Build command `npm run build`, output
directory `dist`. A deploy hook can be triggered from the Notchi repository whenever a release is
published, and a scheduled workflow keeps download counts fresh.

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
