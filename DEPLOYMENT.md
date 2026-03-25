# Flexbone CRM — Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com) with Workers enabled
- [Supabase project](https://supabase.com) (free tier works)
- [Anthropic API key](https://console.anthropic.com) for AI enrichment
- Node.js 20+ and npm

---

## 1. Supabase Project Setup

### Create project
1. Go to https://supabase.com/dashboard and create a new project
2. Choose a region close to your users (recommended: `us-east-1`)
3. Save the generated database password

### Run migrations
Apply the database schema from `supabase/migrations/`:

```bash
npx supabase db push --linked
```

Or apply manually in the Supabase SQL Editor by running the migration files in order:
1. `001_initial_schema.sql` — Core tables (companies, contacts, activities, enrichments)
2. `002_enrichment_config.sql` — Enrichment config table + campaign exports

### Configure authentication
1. Go to **Authentication > Providers** in the Supabase dashboard
2. Enable **Email** provider (enabled by default)
3. Under **URL Configuration**, set:
   - Site URL: `https://crm.flexbone.ai`
   - Redirect URLs: `https://crm.flexbone.ai/auth/callback`

### Enable Realtime
1. Go to **Database > Replication**
2. Enable Realtime for the `ai_enrichment_jobs` table (used by batch progress)

### Get credentials
From **Settings > API**, copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Cloudflare Workers Setup

This project uses the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) to deploy the Next.js app as a Cloudflare Worker.

### Option A: Git integration (recommended)

1. Go to **Workers & Pages** in the Cloudflare dashboard
2. Click **Create** → **Import a Repository** → select the `FlexboneCRM` repo
3. Configure build settings:
   - **Build command**: `npm run cf:build`
   - **Build output directory**: `.open-next`
   - **Root directory**: `flexbone-crm`
   - **Node version**: `20`

### Option B: CLI deploy

```bash
# Login to Cloudflare
npx wrangler login

# Build and deploy
npm run cf:build
npm run cf:deploy
```

### Environment variables
In **Workers > Settings > Variables**, add:

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain text | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain text | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Encrypted** | Your service role key |
| `ANTHROPIC_API_KEY` | **Encrypted** | Your Anthropic API key |
| `NODE_VERSION` | Plain text | `20` |

---

## 3. Custom Domain (crm.flexbone.ai)

### Add domain
1. Go to your Workers project > **Settings > Domains & Routes**
2. Add `crm.flexbone.ai`
3. Cloudflare will auto-create the DNS record if `flexbone.ai` is on Cloudflare DNS

### SSL/TLS
1. Go to **SSL/TLS** in the Cloudflare dashboard (for flexbone.ai zone)
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Set minimum TLS version to **1.2**

---

## 4. Cloudflare Access (Optional Security)

Add an extra authentication layer for the CRM:

1. Go to **Zero Trust > Access > Applications**
2. Click **Add an application > Self-hosted**
3. Configure:
   - Application name: `Flexbone CRM`
   - Session duration: `24h`
   - Application domain: `crm.flexbone.ai`
4. Add a policy:
   - Policy name: `Team Access`
   - Action: **Allow**
   - Include: **Emails ending in** `@flexbone.ai`
5. Save

---

## 5. Deploy

### First deploy (from CLI)
```bash
npx wrangler login
npm run cf:build
npm run cf:deploy
```

### Subsequent deploys
Pushes to `main` will auto-deploy via the Git integration.

### Manual deploy
```bash
npm run cf:build && npm run cf:deploy
```

---

## 6. Verify Deployment

```bash
curl https://crm.flexbone.ai/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 7. Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server (localhost:3000) |
| `npm run build` | Standard Next.js build |
| `npm run cf:build` | Build for Cloudflare Workers (via OpenNext) |
| `npm run cf:dev` | Preview locally with Wrangler |
| `npm run cf:deploy` | Deploy to Cloudflare Workers |

---

## 8. Migrating from Vercel

If you're currently on Vercel:

1. **Disconnect Vercel** — go to Vercel dashboard → project settings → Git → disconnect
2. **Connect Cloudflare** — follow Option A above
3. **Move env vars** — copy all environment variables from Vercel to Cloudflare Workers settings
4. **Update Supabase auth** — change redirect URLs from `*.vercel.app` to `crm.flexbone.ai`
5. **Update DNS** — point `crm.flexbone.ai` to Cloudflare Workers instead of Vercel

---

## Environment Matrix

| Environment | Branch | URL | Supabase |
|-------------|--------|-----|----------|
| Production | `main` | `crm.flexbone.ai` | Production project |
| Preview | PR branches | `*.flexbone-crm.workers.dev` | Production project (or staging) |
| Local | — | `localhost:3000` | Local or dev project |
