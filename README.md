# 📈 Ledge AI — Full-Stack MVP

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-E36002.svg?style=for-the-badge&logo=hono&logoColor=white)

AI-powered financial assistant rebuilt with a modern stack (Turborepo + Vite + Hono), optimized for edge performance and ready for **Cloudflare** deployment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query |
| Backend API | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth | JWT (jose) + PBKDF2 password hashing |
| Market Data | Yahoo Finance (live, no key) + optional Finnhub |
| Deploy Target | Cloudflare Pages (web) + Cloudflare Workers (API) |

## Project Structure

```
apps/
  web/          → React frontend (Cloudflare Pages)
  api/          → Hono API worker (Cloudflare Workers + D1)
packages/
  shared/       → Shared TypeScript types
legacy-html/    → Original static HTML prototype (reference)
```

## MVP Features

- User registration & login (JWT auth)
- Dashboard with live/mock market overview
- Market intelligence page with buy/sell signals
- Stock detail page with AI insights, targets, stop loss
- Personal watchlist (saved in D1 database)
- News feed (Finnhub or mock)
- Landing, Features, Pricing pages

## Quick Start (Local)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `apps/api/.dev.vars` and set:

```
JWT_SECRET=your-long-random-secret
FINNHUB_API_KEY=your_key_from_finnhub.io
```

Get a free Finnhub key at https://finnhub.io/ (optional — mock data works without it).

### 3. Run database migrations (local D1)

```bash
npm run db:migrate:local
```

### 4. Start dev servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787
- Health check: http://localhost:8787/api/health

### 5. Create an account

1. Open http://localhost:5173/register
2. Sign up → you'll land on the dashboard
3. Browse Market → click a stock → Add to Watchlist

## Deploy to Cloudflare

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) logged in: `npx wrangler login`

### Step 1: Create D1 database

```bash
cd apps/api
npx wrangler d1 create ledge-ai-db
```

Copy the `database_id` from output into `apps/api/wrangler.toml`.

### Step 2: Run remote migrations

```bash
npm run db:migrate:remote
```

### Step 3: Set production secrets

```bash
cd apps/api
npx wrangler secret put JWT_SECRET
npx wrangler secret put FINNHUB_API_KEY
```

### Step 4: Deploy API worker

```bash
npm run deploy:api
```

Note your worker URL (e.g. `https://ledge-ai-api.your-subdomain.workers.dev`).

### Step 5: Deploy frontend to Cloudflare Pages

```bash
cd apps/web
# Set API URL for production build
set VITE_API_URL=https://ledge-ai-api.your-subdomain.workers.dev
npm run build
npx wrangler pages deploy dist --project-name=ledge-ai
```

Or connect the GitHub repo in Cloudflare Pages dashboard:
- Build command: `npm run build -w @ledge-ai/web`
- Output directory: `apps/web/dist`
- Environment variable: `VITE_API_URL=https://your-api.workers.dev`

### Step 6: Connect Pages to Worker (optional)

In Cloudflare dashboard → Pages → your project → Settings → Functions:
- Add a route so `/api/*` proxies to your Worker

Or use `VITE_API_URL` pointing directly to the worker URL.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/me` | Yes | Current user |
| GET | `/api/quotes` | No | Default stock quotes |
| GET | `/api/quote/:symbol` | No | Quote + AI insight |
| GET | `/api/insights/:symbol` | No | AI recommendation |
| GET | `/api/news` | No | Market news |
| GET | `/api/dashboard` | Yes | Dashboard data |
| GET | `/api/watchlist` | Yes | User watchlist |
| POST | `/api/watchlist` | Yes | Add symbol |
| DELETE | `/api/watchlist/:symbol` | Yes | Remove symbol |

## Disclaimer

This MVP provides informational market analysis only. It is **not financial advice**. Add proper disclaimers before production use.

## Next Steps (Post-MVP)

- [ ] Stripe/Razorpay for Pro subscriptions
- [ ] Real chart library (Lightweight Charts)
- [ ] OpenAI/Gemini for natural language advisor
- [ ] Portfolio holdings & P&L tracking
- [ ] Email alerts for price targets
- [ ] Cloudflare KV caching for market data rate limits
