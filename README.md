# AI Jigsaw Puzzle Maker

Create, generate, and solve custom AI-powered jigsaw puzzles. The web app lets you craft image prompts or pick curated styles, automatically generates puzzle-ready artwork, cuts it into premium interlocking pieces, and stores everything locally so you can build a library, resume progress, and tune play settings. The companion Cloudflare Worker handles safe prompt composition and image generation so your API key never touches the browser.

## Structure
- apps/web: React 18 + Vite + MUI
- workers/api: Cloudflare Worker API

## Local dev
- Worker: `cd workers/api && npm i && npx wrangler dev`
- Web: `cd apps/web && npm i && npm run dev`

## Tests
From `apps/web`:
- Unit + coverage: `npm run test` (watch) or `npm run test:coverage`
- Playwright smoke: `npm run test:e2e` (first run requires `npx playwright install chromium`)
- UI test UI: `npm run test:e2e:ui`

## Build and deploy
### Web (Cloudflare Pages)
- Build: `cd apps/web && npm run build`
- Preview locally: `npm run dev` (proxy expects Worker at `http://127.0.0.1:8787`)
- Deploy (Pages Direct Upload): `npx wrangler pages deploy dist` from `apps/web` after build

### API Worker
- Dev: `cd workers/api && npm run dev`
- Deploy: `cd workers/api && npm run deploy`
- Config: `workers/api/wrangler.jsonc`

### Required secrets / env
Set in Cloudflare (or `.dev.vars` for local wrangler):
- `AI_PUZZLE_MAKER__GEMINI_API_KEY` (required)
- Optional: `AI_PUZZLE_MAKER__GEMINI_BASE_URL` (default `https://generativelanguage.googleapis.com`)

### Overview of commands
- Install deps (web): `cd apps/web && npm install`
- Install deps (api): `cd workers/api && npm install`
- Run both for dev: start `wrangler dev` (api) then `npm run dev` (web)
- Tests: `npm run test` (unit), `npm run test:e2e` (smoke)
