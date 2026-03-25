# Flexbone CRM

Healthcare revenue intelligence platform with AI-powered company enrichment, pipeline management, and multi-channel outreach tools built for healthcare sales teams.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [AI Enrichment System](#ai-enrichment-system)
  - [How It Works](#how-it-works)
  - [Enrichment API Routes](#enrichment-api-routes)
  - [Changing the Prompts](#changing-the-prompts)
  - [Prompt File Reference](#prompt-file-reference)
  - [Changing the Model](#changing-the-model)
- [CSV Export](#csv-export)
  - [Exporting Enriched Companies](#exporting-enriched-companies)
  - [Export Utility API](#export-utility-api)
- [Features](#features)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Data Import](#data-import)
- [Deployment](#deployment)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19, TypeScript 5) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| AI Engine | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Styling | Tailwind CSS 4 + shadcn/ui + Radix UI |
| Hosting | Cloudflare Pages (Edge Runtime) |
| Charts | Recharts |
| Tables | TanStack React Table |
| Data Import | xlsx (SheetJS) |

---

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
│  │  │          │  │  Detail  │  │            │  │   │
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
│  │  └──────────┬──────────────┬──────────────┘   │   │
│  └─────────────┼──────────────┼──────────────────┘   │
│                │              │                       │
└────────────────┼──────────────┼───────────────────────┘
                 │              │
        ┌────────▼────┐  ┌─────▼──────┐
        │  Supabase   │  │  Anthropic │
        │ PostgreSQL  │  │   Claude   │
        │  + Auth     │  │            │
        │  + Realtime │  │  AI Enrich │
        └─────────────┘  └────────────┘
```

**Request flow:**

1. User clicks "Enrich" in the UI (or triggers a batch)
2. Client-side component calls an Edge API route (`/api/enrich/*`)
3. The route authenticates the request, fetches entity data from Supabase
4. Builds a context prompt from the entity's fields
5. Sends the context + a system prompt to Claude via the Anthropic SDK
6. Parses the structured JSON (or markdown) response
7. Saves the enrichment result to Supabase (`company_enrichments`, `activities`, `ai_enrichment_jobs`)
8. Returns the result to the client

---

## Getting Started

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

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables)).

### 3. Run database migrations

```bash
npx supabase db push --linked
# or run the SQL files from supabase/migrations/ manually in the Supabase SQL editor
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude enrichment |

---

## Database Schema

### Core Tables

```
companies                    contacts
├── id (uuid, PK)           ├── id (uuid, PK)
├── company_name             ├── company_id (FK → companies)
├── clean_company_name       ├── first_name, last_name
├── website                  ├── title, colloquial_title
├── city, state              ├── email, secondary_email
├── company_size             ├── phone, linkedin
├── flexbone_category        ├── owner
├── source, company_type     ├── stage (enum: new → closed_won/lost)
├── ehr, specialty           ├── priority_tier (tier_1/2/3)
├── has_asc                  ├── flexbone_category, source
├── surgeries_per_year       ├── campaign_batch
├── high_volume_cpt_codes    ├── engagement_notes
├── annual_revenue           └── created_at, updated_at
├── account_owner
├── account_stage
└── created_at, updated_at
```

### Enrichment & Tracking Tables

```
company_enrichments              ai_enrichment_jobs
├── company_id (FK, unique)     ├── id (uuid, PK)
├── facility_type, parent_org   ├── company_id / contact_id
├── locations, providers        ├── job_type
├── operating_rooms             ├── status (processing/completed/failed)
├── annual_cases                ├── model_used
├── estimated_revenue           ├── tokens_used
├── revenue_math                ├── input_data, output_data
├── specialties                 ├── error_message
├── cpt_1/2/3_code + details   └── created_at, completed_at
├── ehr_system + confidence
├── insurances_accepted         activities
├── competitors 1-3             ├── id (uuid, PK)
├── google_rating/reviews       ├── company_id / contact_id
├── *_hook fields (8 hooks)     ├── activity_type
├── outreach_angle              ├── subject, body
├── best_subject_line           ├── outcome, channel
├── best_opening_sentence       └── metadata (jsonb)
├── full_json (jsonb)
└── enriched_date
```

### Key Enums

| Enum | Values |
|------|--------|
| `flexbone_category` | ASC, SNF, BPO, Health System, Insurer, Optometry, DSO, Newsletter, ASC Association |
| `contact_stage` | new, contacted, qualified, demo_scheduled, proposal_sent, negotiation, closed_won, closed_lost, churned |
| `priority_tier` | tier_1, tier_2, tier_3, unassigned |
| `contact_source` | Apollo, Beckers ASC Review, ASCA.org, GA_Urology, GA_Eye_Partners, Resurgens, Orlando_Health_Execs, Manual, Import, Other |

---

## AI Enrichment System

### How It Works

The enrichment system uses Anthropic's Claude to generate structured intelligence about healthcare companies and contacts. Each enrichment call:

1. Pulls existing entity data from Supabase as context
2. Sends it to Claude with a detailed system prompt
3. Parses the structured response (JSON for companies, markdown for contacts)
4. Saves results to the database and logs the activity

All enrichment routes run on **Edge Runtime** with authentication and rate limiting (10 req/min for single, 5 req/min for batch).

### Enrichment API Routes

| Route | Method | Purpose | Output |
|-------|--------|---------|--------|
| `/api/enrich/company` | POST | Enrich a single company | 70+ field JSON saved to `company_enrichments` |
| `/api/enrich/contact` | POST | Research a single contact | Markdown analysis saved as activity |
| `/api/enrich/batch` | POST | Batch enrich up to 50 companies or contacts | Concurrent processing (5 at a time) |
| `/api/enrich/outreach` | POST | Generate outreach content for a contact | Email variants, LinkedIn messages, or phone scripts |

### Changing the Prompts

**This is the most common customization you'll make.** Each enrichment route has its own system prompt defined as a `const` at the top of the route file. Here's how to modify them:

#### Company Enrichment Prompt

**File:** `src/app/api/enrich/company/route.ts`
**Variable:** `SYSTEM_PROMPT` (line 8)

This is the main enrichment prompt. It tells Claude to act as a "healthcare sales intelligence analyst" and return a JSON object with ~70 fields covering:

- Facility intelligence (type, parent org, locations, providers, revenue)
- CPT code intelligence (3 top procedures with volumes and reimbursement)
- Technology stack (EHR, patient portal, scheduling, chat)
- Payer intelligence (insurances, Medicare/Medicaid, gaps)
- Forms & intake (online forms, format)
- Competitive landscape (3 competitors)
- Staffing (hiring status, open roles)
- Reviews (Google rating, complaints)
- Outreach content (hooks, angles, subject lines, opening sentences)

**To modify:**
1. Open `src/app/api/enrich/company/route.ts`
2. Edit the `SYSTEM_PROMPT` string starting at line 8
3. To add/remove fields, update the JSON schema in the prompt AND update the `enrichmentRecord` mapping (line 172-235) that saves fields to the database
4. If adding new database columns, also update:
   - `supabase/migrations/` — add a new migration with `ALTER TABLE company_enrichments ADD COLUMN ...`
   - `src/lib/supabase/types.ts` — add the field to the `CompanyEnrichment` interface

**Example — adding a new field:**
```typescript
// 1. Add to the JSON schema in SYSTEM_PROMPT:
//    "telehealth_capability": "boolean - whether they offer telehealth",

// 2. Add to enrichmentRecord in the route handler:
//    telehealth_capability: Boolean(enrichmentData.telehealth_capability),

// 3. Add the column to the database:
//    ALTER TABLE company_enrichments ADD COLUMN telehealth_capability boolean DEFAULT false;
```

#### Contact Research Prompt

**File:** `src/app/api/enrich/contact/route.ts`
**Variable:** `SYSTEM_PROMPT` (line 7)

Returns markdown-formatted analysis with sections:
- Role Analysis
- Pain Points
- LinkedIn Profile Insights
- Personalized Outreach Angles
- Recommended Approach
- Ice Breakers
- Key Talking Points
- Cautions

**To modify:** Edit the markdown template in `SYSTEM_PROMPT`. Since this returns markdown (not JSON), you can freely add/remove/rename sections without any database changes — the full text is stored in the `activities.body` column.

#### Batch Enrichment Prompts

**File:** `src/app/api/enrich/batch/route.ts`
**Variables:**
- `COMPANY_SYSTEM_PROMPT` (line 10) — simplified version of company enrichment (~11 fields)
- `CONTACT_SYSTEM_PROMPT` (line 27) — simplified version of contact research (~6 fields)

These are intentionally lighter than the single-entity prompts to keep batch processing fast and cost-effective. If you want batch enrichment to produce the same depth as single enrichment, replace these prompts with the full versions from the single-entity routes (and update the field mappings accordingly).

#### Outreach Generation Prompts

**File:** `src/app/api/enrich/outreach/route.ts`
**Variables:**
- `EMAIL_SYSTEM_PROMPT` (line 7) — generates 3 cold email variants (Pain Point, Social Proof, Value Prop)
- `LINKEDIN_SYSTEM_PROMPT` (line 42) — generates connection request + follow-up InMail
- `PHONE_SYSTEM_PROMPT` (line 58) — generates call script with objection handlers

**To modify:** Each prompt defines its own JSON output schema. Edit the prompt and the schema together. These results are returned directly to the client (not saved to the database), so no migration is needed.

### Prompt File Reference

| What to change | File | Variable(s) |
|----------------|------|-------------|
| Company enrichment fields/instructions | `src/app/api/enrich/company/route.ts` | `SYSTEM_PROMPT` |
| Contact research sections | `src/app/api/enrich/contact/route.ts` | `SYSTEM_PROMPT` |
| Batch company enrichment | `src/app/api/enrich/batch/route.ts` | `COMPANY_SYSTEM_PROMPT` |
| Batch contact enrichment | `src/app/api/enrich/batch/route.ts` | `CONTACT_SYSTEM_PROMPT` |
| Cold email templates | `src/app/api/enrich/outreach/route.ts` | `EMAIL_SYSTEM_PROMPT` |
| LinkedIn outreach | `src/app/api/enrich/outreach/route.ts` | `LINKEDIN_SYSTEM_PROMPT` |
| Phone scripts | `src/app/api/enrich/outreach/route.ts` | `PHONE_SYSTEM_PROMPT` |

### Changing the Model

The model is defined in `src/lib/ai/anthropic.ts`:

```typescript
const MODEL = 'claude-sonnet-4-20250514' as const
```

To switch models (e.g., to Claude Opus for higher quality enrichment, or Haiku for cheaper batch runs), change this single line. All enrichment routes import `MODEL` from this file.

The client configuration:
- **Max tokens:** 4096 (default, configurable per-call)
- **Temperature:** 0.3 for enrichment (factual), 0.7 for outreach (creative)
- **Retry logic:** 3 attempts with exponential backoff on rate limit / server errors
- **No retry on:** authentication errors, bad request errors

---

## CSV Export

### Current Export (Settings Page)

The Settings page (`/dashboard/settings`) has two export buttons:

- **Export Contacts CSV** — exports `first_name, last_name, email, phone, title, stage, category`
- **Export Companies CSV** — exports `company_name, city, state, phone, website, category, contact_count`

These export basic fields only, up to 10,000 rows, and are client-side downloads.

### Exporting Enriched Companies

To export companies **with enrichment data**, you need to join the `companies` and `company_enrichments` tables. The existing `ExportCompaniesButton` in `src/components/settings/export-buttons.tsx` can be extended:

**Option 1: Modify the existing export button** to include enrichment fields by changing the Supabase query to join the enrichment table:

```typescript
const { data, error } = await supabase
  .from('companies')
  .select(`
    company_name, city, state, website, flexbone_category,
    company_enrichments (
      facility_type, estimated_revenue, specialties, ehr_system,
      outreach_angle, best_subject_line, best_opening_sentence,
      facility_hook, cpt_hook, tech_hook, payer_hook
    )
  `)
  .order('company_name')
  .limit(10000)
```

Then flatten the nested enrichment object before passing to `exportToCSV`.

**Option 2: Add a dedicated "Export Enriched" button** that only exports companies that have been enriched, with all the enrichment fields included.

### Export Utility API

The CSV export utility lives at `src/lib/export-csv.ts`:

```typescript
exportToCSV(
  data: Record<string, unknown>[],   // array of row objects
  filename: string,                    // e.g. "flexbone-enriched-companies"
  columns?: { key: string; label: string }[]  // column definitions
)
```

- Handles CSV escaping (commas, quotes, newlines)
- Auto-appends date to filename: `flexbone-enriched-companies-2026-03-24.csv`
- Client-side download via Blob URL

---

## Features

### Dashboard
Pipeline overview, category breakdown charts, activity feed, quick action buttons (new contact, new company, run enrichment, new campaign).

### Companies
Filterable/sortable table with detail pages. Filters: search, category, state, company size, ASC status, enrichment status. Detail view with enrichment card showing all 70+ fields organized in collapsible sections.

### Contacts
Table view and Kanban board (toggle between views). 9-stage pipeline: new → contacted → qualified → demo_scheduled → proposal_sent → negotiation → closed_won / closed_lost / churned. Filters: stage, category, source, priority tier, owner, campaign batch, date ranges.

### Pipeline
Visual Kanban board for drag-and-drop pipeline management across all 9 contact stages.

### AI Enrichment Hub
- **Single company enrichment** with search dialog
- **Single contact research** with AI-generated analysis
- **Batch enrichment** of up to 50 companies at once (5 concurrent)
- **Real-time progress** via Supabase Realtime subscriptions
- **Outreach generator** for email, LinkedIn, and phone scripts

### Campaigns
Campaign creation and management with contact tracking and stage breakdowns.

### Activities
Timeline view of all interactions (emails, calls, LinkedIn, meetings, notes, enrichments) with type/date filters and the ability to log new activities.

### Global Search
`Cmd+K` command palette searching across contacts and companies.

### Settings
Team management, import/export (CSV), notification preferences, API key configuration, data health dashboard.

---

## Project Structure

```
src/
├── app/
│   ├── api/enrich/              # AI enrichment API routes (Edge)
│   │   ├── company/route.ts     #   Single company enrichment
│   │   ├── contact/route.ts     #   Single contact research
│   │   ├── batch/route.ts       #   Batch enrichment (up to 50)
│   │   └── outreach/route.ts    #   Outreach content generation
│   ├── auth/callback/           # Supabase auth callback
│   ├── dashboard/               # Main CRM pages
│   │   ├── page.tsx             #   Dashboard overview
│   │   ├── companies/           #   Company list + detail pages
│   │   ├── contacts/            #   Contact list + detail pages
│   │   ├── pipeline/            #   Kanban board
│   │   ├── enrichment/          #   AI enrichment hub
│   │   ├── campaigns/           #   Campaign management
│   │   ├── activities/          #   Activity timeline
│   │   └── settings/            #   Settings + import/export
│   └── login/                   # Login page
├── components/
│   ├── enrichment/              # Enrichment UI components
│   │   ├── enrich-button.tsx    #   Inline enrich trigger
│   │   ├── enrichment-card.tsx  #   Full enrichment data display
│   │   ├── enrichment-actions.tsx  # Enrichment hub actions
│   │   ├── batch-progress.tsx   #   Real-time batch progress
│   │   └── outreach-generator.tsx  # AI outreach content
│   ├── companies/               # Company table, filters, search
│   ├── contacts/                # Contact table, filters, kanban
│   ├── activities/              # Activity timeline, filters
│   ├── campaigns/               # Campaign components
│   ├── dashboard/               # Shell, sidebar, topbar, charts
│   ├── settings/                # Export buttons, import
│   └── ui/                      # shadcn/ui primitives (20+ components)
├── lib/
│   ├── ai/
│   │   └── anthropic.ts         # Claude client (model, retry, JSON extraction)
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   ├── middleware.ts        # Auth session refresh
│   │   └── types.ts             # TypeScript interfaces for all tables
│   ├── queries/
│   │   ├── companies.ts         # Company queries with filters + pagination
│   │   ├── contacts.ts          # Contact queries + pipeline data
│   │   ├── activities.ts        # Activity queries
│   │   └── campaigns.ts         # Campaign queries
│   ├── api-auth.ts              # API route auth + rate limiting
│   ├── export-csv.ts            # CSV export utility
│   ├── rate-limit.ts            # Rate limiter implementation
│   └── utils.ts                 # Shared utilities (cn, etc.)
├── middleware.ts                 # Next.js middleware (auth session refresh)
└── scripts/
    └── migrate.ts               # Data migration script

supabase/
└── migrations/
    └── 001_initial_schema.sql   # Full database schema

scripts/
└── import-xlsx.mjs              # Excel data import script
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Run data migration script |
| `npm run pages:build` | Build for Cloudflare Pages |
| `npm run pages:dev` | Local preview with Wrangler |
| `npm run pages:deploy` | Deploy to Cloudflare Pages |

---

## Data Import

The import script (`scripts/import-xlsx.mjs`) reads from an Excel workbook with these sheets:

| Sheet Name | Target Table | Notes |
|------------|-------------|-------|
| `crm-companies` | `companies` | De-duplicated by company_name |
| `crm-contacts` | `contacts` | FK resolution to company_id |
| `company-enrichment` | `company_enrichments` | Linked to companies |
| `Accounts` | `companies` (merge) | Additional fields merged in |

Features:
- Batch upserts (500 rows per batch)
- Enum normalization (stages, categories, sources)
- Excel date conversion to ISO format
- Progress tracking and error reporting

```bash
# Run the import
node scripts/import-xlsx.mjs
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide covering:

- Supabase project setup (migrations, auth, realtime)
- Cloudflare Pages configuration (build settings, env vars)
- Custom domain setup (crm.flexbone.ai with SSL/TLS)
- Cloudflare Access security layer
- Preview vs production environments

### Quick deploy

```bash
npm run pages:build
npm run pages:deploy
```
