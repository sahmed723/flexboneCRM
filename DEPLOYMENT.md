# Flexbone CRM — Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com) with Pages enabled
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

Or apply manually in the Supabase SQL Editor by running the migration files in order.

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

## 2. Cloudflare Pages Setup

### Connect repository
1. Go to **Workers & Pages** in the Cloudflare dashboard
2. Click **Create application > Pages > Connect to Git**
3. Select the `FlexboneCRM` repository
4. Configure build settings:
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `flexbone-crm`
   - **Node version**: `20`

### Environment variables
In **Settings > Environment variables**, add:

| Variable | Type | Value |
|----------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain text | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain text | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Encrypted** | Your service role key |
| `ANTHROPIC_API_KEY` | **Encrypted** | Your Anthropic API key |
| `NODE_VERSION` | Plain text | `20` |

Set these for **both** Production and Preview environments.

---

## 3. Custom Domain (crm.flexbone.ai)

### Add domain
1. Go to your Pages project > **Custom domains**
2. Click **Set up a custom domain**
3. Enter `crm.flexbone.ai`
4. Cloudflare will auto-create the DNS record if `flexbone.ai` is on Cloudflare DNS

### SSL/TLS
1. Go to **SSL/TLS** in the Cloudflare dashboard (for flexbone.ai zone)
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**
5. Set minimum TLS version to **1.2**

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
# Login to Cloudflare
npx wrangler login

# Build and deploy
npm run pages:build
npm run pages:deploy
```

### Subsequent deploys
Pushes to `main` will auto-deploy via the Git integration.

Preview deployments are created for every pull request.

### Manual deploy
```bash
npm run pages:build && npm run pages:deploy
```

---

## 6. Verify Deployment

```bash
# Health check
curl https://crm.flexbone.ai/api/health

# Expected response
# {"status":"ok","timestamp":"...","version":"abc1234","environment":"production"}
```

---

## 7. Monitoring

### Cloudflare analytics
- **Web Analytics**: Enabled by default on Pages
- **Workers Analytics**: View request counts, errors, CPU time under Workers & Pages

### Error tracking
Check **Functions > Real-time Logs** in the Pages dashboard for server-side errors.

---

## Environment Matrix

| Environment | Branch | URL | Supabase |
|-------------|--------|-----|----------|
| Production | `main` | `crm.flexbone.ai` | Production project |
| Preview | PR branches | `*.flexbone-crm.pages.dev` | Production project (or staging) |
| Local | — | `localhost:3000` | Local or dev project |
