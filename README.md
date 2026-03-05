# Flexbone CRM

Healthcare revenue intelligence platform. AI-enriched company and contact data, campaign management, and multi-channel outreach tools for the healthcare sales vertical.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| AI Engine | Anthropic Claude Opus 4.6 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Hosting | Cloudflare Pages |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare Pages                   │
│  ┌──────────────────────────────────────────────┐   │
│  │              Next.js App Router               │   │
│  │                                               │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │Dashboard │  │ Company/ │  │ Enrichment │  │   │
│  │  │ Overview │  │ Contact  │  │    Hub     │  │   │
│  │  │         │  │  Detail  │  │            │  │   │
│  │  └─────────┘  └──────────┘  └────────────┘  │   │
│  │                                               │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │Pipeline │  │Activities│  │ Campaigns  │  │   │
│  │  │  Board  │  │ Timeline │  │  Manager   │  │   │
│  │  └─────────┘  └──────────┘  └────────────┘  │   │
│  │                                               │   │
│  │  ┌───────────────────────────────────────┐   │   │
│  │  │          API Routes (Edge)             │   │   │
│  │  │  /api/enrich/company                   │   │   │
│  │  │  /api/enrich/contact                   │   │   │
│  │  │  /api/enrich/outreach                  │   │   │
│  │  │  /api/enrich/batch                     │   │   │
│  │  │  /api/health                           │   │   │
│  │  └──────────┬──────────────┬──────────────┘   │   │
│  └─────────────┼──────────────┼──────────────────┘   │
│                │              │                       │
└────────────────┼──────────────┼───────────────────────┘
                 │              │
        ┌────────▼────┐  ┌─────▼──────┐
        │  Supabase   │  │  Anthropic │
        │ PostgreSQL  │  │ Claude 4.6 │
        │  + Auth     │  │            │
        │  + Realtime │  │  AI Enrich │
        └─────────────┘  └────────────┘
```

## Data Model

```
companies ──────────┐
  id                 │ 1:N
  company_name       │
  flexbone_category  │
  state, city        │
  website            │
  ehr, specialty     │
  account_stage      │
  ...                │
                     │
contacts ◄───────────┘
  id                 ├──── activities
  first_name          │      id
  last_name           │      contact_id
  title               │      activity_type
  email, phone        │      subject, body
  company_id (FK)     │      channel, outcome
  stage               │
  priority_tier       ├──── campaign_contacts
  owner               │      contact_id
  ...                 │      campaign_id
                      │      stage
company_enrichments   │
  company_id (FK) ────┘   campaigns
  facility_type            id
  parent_org               name, status
  cpt_1_code...            description
  ehr_system               start_date
  estimated_revenue
  specialties          ai_enrichment_jobs
  competitors            id
  hooks (facility,       company_id / contact_id
   cpt, tech, payer,     job_type
   review, staffing)     status
  outreach_angle         model_used
  best_subject_line      tokens_used
  ...                    output_data
```

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd flexbone-crm
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase and Anthropic credentials.

### 3. Run database migrations

```bash
npx supabase db push --linked
# or run SQL files from supabase/migrations/ manually
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Run data migration script |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run pages:dev` | Local preview with Wrangler |
| `npm run pages:deploy` | Deploy to Cloudflare Pages |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full deployment guide including:

- Supabase project setup
- Cloudflare Pages configuration
- Custom domain (crm.flexbone.ai)
- SSL/TLS and Cloudflare Access setup
- Environment variable configuration

### Quick deploy

```bash
npm run pages:build
npm run pages:deploy
```

## Key Features

- **Dashboard** — Pipeline overview, revenue metrics, activity feed, company stats
- **Companies** — Filterable list, detail pages with tabs (overview, contacts, enrichment, procedures, activities)
- **Contacts** — Searchable directory, detail pages with timeline, campaign history
- **Pipeline** — Kanban board with drag-and-drop stage management
- **Activities** — Timeline view with filters, log activity modal
- **Campaigns** — Campaign management with contact tracking and stage breakdowns
- **AI Enrichment** — Claude-powered company intelligence (facility data, CPT codes, tech stack, payer info, competitors, hiring, reviews, outreach hooks)
- **Outreach Generator** — AI-generated email variants, LinkedIn messages, phone scripts
- **Batch Enrichment** — Process up to 50 companies with realtime progress tracking
- **Global Search** — Cmd+K command palette searching contacts and companies
- **Settings** — Team management, API keys, import/export, notifications

## Project Structure

```
src/
├── app/
│   ├── api/enrich/          # AI enrichment API routes
│   ├── auth/callback/       # Supabase auth callback
│   ├── dashboard/           # Main CRM pages
│   │   ├── activities/
│   │   ├── campaigns/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── enrichment/
│   │   ├── pipeline/
│   │   └── settings/
│   └── login/
├── components/
│   ├── activities/          # Activity timeline, filters
│   ├── campaigns/           # Campaign components
│   ├── companies/           # Company table, filters
│   ├── contacts/            # Contact search, filters
│   ├── dashboard/           # Shell, sidebar, topbar, stats
│   ├── enrichment/          # EnrichButton, EnrichmentCard,
│   │                        # OutreachGenerator, BatchProgress
│   ├── pipeline/            # Kanban board
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── ai/                  # Anthropic client
│   ├── queries/             # Supabase query layers
│   └── supabase/            # Supabase client (server/client/middleware)
└── middleware.ts             # Auth session refresh
```
