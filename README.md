<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Razorpay-Integrated-0C2451?style=for-the-badge&logo=razorpay" alt="Razorpay" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

# 🛁 Welcona — Luxury Bath Fittings Ecommerce

> A **production-deployed, full-stack ecommerce platform** built from scratch for a premium bath fittings brand. Custom-engineered with atomic inventory management, dual payment flows, and a complete admin dashboard — serving real customers in production.

---

## ✨ Highlights

- 🔒 **Atomic checkout** with PostgreSQL row-level locking (`SELECT ... FOR UPDATE`)
- 💳 **Dual payment architecture** — Razorpay (online) + WhatsApp (bulk orders)
- 🛡️ **Server-authoritative pricing** — cart prices are never trusted from the client
- 📧 **6 transactional email templates** with branded HTML via Resend
- 🤖 **Automated health monitoring** via Vercel cron jobs
- 🎨 **OKLCH design system** with glassmorphism, dark/light mode, and Framer Motion animations
- 📱 **Fully responsive** — mobile-first with dedicated mobile navigation

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Client (Browser)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Storefront   │  │  Admin Panel  │  │  Cart Drawer  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│              Next.js 16 (App Router)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ Middleware  │  │   Server   │  │   API Route        │  │
│  │ (JWT Auth)  │  │ Components │  │   Handlers         │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ Prisma ORM │  │  Razorpay  │  │   Resend   │
   │   + PG     │  │    SDK     │  │   Emails   │
   └──────┬─────┘  └────────────┘  └────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌─────────────────────┐  ┌───────────────────────────┐  │
│  │  PostgreSQL          │  │  Supabase Storage         │  │
│  │  (Supabase Hosted)   │  │  (Product Images)         │  │
│  └─────────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Full-stack framework with SSR, API routes, edge middleware |
| **React 19** | UI library with concurrent features |
| **TypeScript 5** | End-to-end type safety |
| **TailwindCSS 4** | Utility-first styling with custom OKLCH design tokens |
| **Framer Motion** | Page transitions, scroll animations, micro-interactions |
| **shadcn/ui + Radix UI** | Accessible, composable UI primitives |
| **React Hook Form + Zod** | Schema-based form validation |
| **TanStack React Query** | Server state, caching, infinite queries |

### Backend

| Technology | Purpose |
|---|---|
| **Next.js API Routes** | RESTful endpoints (App Router route handlers) |
| **Prisma ORM 7** | Type-safe database access with migrations |
| **PostgreSQL** | Relational DB hosted on Supabase |
| **Razorpay SDK** | Payment gateway (order creation + HMAC verification) |
| **Resend** | Transactional email delivery |
| **jose** | JWT signing/verification (HS256) |
| **bcrypt** | Admin password hashing |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Vercel** | Production hosting (serverless + edge) |
| **Supabase** | Managed PostgreSQL + object storage |
| **Vercel Cron** | Daily automated health checks |
| **Git** | Version control |

---

## 📦 Features

### Customer Storefront

- **Dynamic Homepage** — Hero section, animated marquee, tabbed product browser, category showcase, animated stats
- **Product Catalog** — Server-side paginated listing with search, category filters, sort, and wholesale filter
- **Product Detail** — Image gallery, retail/wholesale/discounted pricing, similar products, share button
- **Cart System** — `localStorage`-based guest cart, slide-out drawer, real-time server price fetching, stock validation
- **Guest Checkout** — No login required — name, email, phone, address, delivery option
- **My Orders** — Order lookup by email + reference ID (no account needed)

### Payment Processing

- **Razorpay Integration** — Full flow: order creation → popup checkout → HMAC-SHA256 signature verification
- **Bulk Order Routing** — Orders above configurable threshold (₹10,000) routed to WhatsApp manual payment
- **Race-Condition-Proof** — `SELECT ... FOR UPDATE` row-level locking inside `$transaction` prevents double-selling
- **Server-Side Price Authority** — Prices recalculated from DB on every checkout, never trusted from client

### Admin Dashboard

- **Product Management** — Full CRUD with image uploads (Supabase Storage), pricing, inventory, tags, SKU
- **Category Management** — CRUD with image upload
- **Order Management** — List, filter, view details, update status lifecycle (PENDING → CONFIRMED → SHIPPED → DELIVERED / CANCELLED)
- **JWT Authentication** — bcrypt-hashed passwords, middleware-protected routes, role-based access

### Email System

6 transactional email templates via **Resend** with premium HTML:

| Email | Trigger |
|---|---|
| Customer Order Confirmation | After Razorpay payment |
| Admin Order Notification | After any new order |
| Bulk Order — Customer | Bulk order received |
| Bulk Order — Admin | Admin action required |
| Bulk Order Confirmed | Admin confirms payment |
| System Health Check | Daily cron job |

### Automated Monitoring

- **Vercel Cron Job** — Runs daily at 12:00 PM IST
- **Health Check** — Verifies DB connectivity, counts products, sends status email to admin
- **Auth-protected** — Cron route secured via `CRON_SECRET` bearer token

---

## 🗄️ Database Schema

**7 models** with well-defined relationships:

```
Admin ─────────────────── (standalone)
Category ──┐
           ├── Product ── ProductImage[]
           │      │
           │      └── OrderItem[]
           │              │
           └────────── Order ── OrderItem[]
```

**Key Enums:**
- `PaymentMethod` — `ONLINE` | `WHATSAPP`
- `OrderStatus` — `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED` | `CANCELLED`
- `DeliveryOption` — `CUSTOMER_PICKUP` | `HOME_DELIVERY`

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| **Authentication** | JWT sessions via `jose` (HS256), HTTP-only cookies |
| **Middleware Guard** | Edge middleware intercepts `/admin/*`, verifies JWT + role |
| **Password Security** | bcrypt hashed admin passwords |
| **Payment Verification** | HMAC-SHA256 Razorpay signature verification |
| **Race Conditions** | `SELECT ... FOR UPDATE` row-level locking in transactions |
| **Environment Secrets** | JWT, Razorpay, Supabase, Resend, Cron secrets in env vars |
| **Cron Protection** | Bearer token authorization on cron endpoint |

---

## 📁 Project Structure

```
welcona/
├── app/
│   ├── (users)/                     # Customer-facing routes
│   │   ├── page.tsx                 # Homepage (SSR)
│   │   ├── products/                # Catalog + detail pages
│   │   │   └── [id]/               # Dynamic product page (SEO metadata)
│   │   ├── my-orders/              # Order lookup
│   │   ├── about/                  # About page
│   │   ├── privacy/                # Privacy policy
│   │   └── terms/                  # Terms & conditions
│   ├── admin/                       # Admin dashboard (protected)
│   │   ├── products/               # Product CRUD
│   │   ├── orders/                 # Order management
│   │   └── categories/            # Category CRUD
│   ├── api/                         # API route handlers
│   │   ├── admin/                  # Admin endpoints
│   │   ├── checkout/               # Order + Razorpay flows
│   │   ├── products/               # Public product APIs
│   │   ├── orders/                 # Customer order lookup
│   │   └── cron/                   # Health check cron
│   ├── layout.tsx                   # Root layout (providers, fonts, SEO)
│   └── globals.css                  # OKLCH design system
├── components/
│   ├── users/                       # Storefront components
│   ├── admin/                       # Admin components
│   ├── providers/                   # Context providers
│   └── ui/                          # shadcn/ui primitives (15+)
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── session.ts                   # JWT sign/verify, cookies
│   ├── email.ts                     # 6 email templates (23KB)
│   ├── supabase.ts                  # Supabase clients
│   ├── utils.ts                     # Shared utilities
│   └── actions/                     # Server actions (auth, CRUD)
├── prisma/
│   ├── schema.prisma                # 7 models, 3 enums
│   ├── seed.ts                      # Comprehensive seeder
│   └── migrations/                  # SQL migration history
├── middleware.ts                     # Edge auth middleware
└── vercel.json                      # Cron configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase account)
- Razorpay account (test/live keys)
- Resend account (for transactional emails)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/kushkumarkashyap7280/welcona.git
cd welcona

# 2. Install dependencies
npm install

# 3. Configure environment
cp env.sample .env
# Fill in all values in .env

# 4. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate deploy

# 5. Seed the database (optional)
npx prisma db seed

# 6. Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Direct DB connection (for migrations) |
| `JWT_SECRET` | Secret for JWT signing |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RESEND_API_KEY` | Resend email API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CRON_SECRET` | Bearer token for cron endpoint |
| `NEXT_PUBLIC_APP_URL` | Production app URL |

> See [`env.sample`](./env.sample) for the complete list.

---

## 📊 Project Metrics

| Metric | Value |
|---|---|
| Source Files | ~60+ TypeScript/TSX |
| Database Models | 7 models + 3 enums |
| API Endpoints | 15+ route handlers |
| UI Components | 35+ (15 shadcn + 20 custom) |
| Email Templates | 6 transactional emails |
| Server Actions | 5 action modules |
| CSS Design Tokens | 50+ OKLCH custom properties |

---

## 🏛️ Key Engineering Decisions

| Decision | Rationale |
|---|---|
| **Row-level locking** over optimistic concurrency | Prevents overselling in concurrent checkout scenarios — critical for inventory integrity |
| **Server-side price recalculation** | Client-side prices can be tampered; all pricing logic runs server-side from the DB |
| **Guest checkout** over forced registration | Reduces friction for a B2C bath fittings store — customers buy without creating accounts |
| **Dual payment routing** | Bulk orders (₹10,000+) need manual verification; Razorpay handles standard orders automatically |
| **Edge middleware** for auth | JWT verification happens before the request hits serverless functions — faster, more secure |
| **OKLCH color space** for theming | Perceptually uniform colors ensure consistent dark/light mode without manual tuning |

---

## 🚢 Deployment

| Aspect | Detail |
|---|---|
| **Hosting** | Vercel (Serverless + Edge) |
| **Database** | Supabase PostgreSQL (PrismaPg adapter) |
| **Image Storage** | Supabase Storage Buckets |
| **Cron** | Vercel Cron — daily at 12:00 PM IST |
| **CI/CD** | Git push → Vercel auto-deploy |

---

<p align="center">
  <sub>Built by <strong>Kush Kumar</strong> · Sarvagya Labs · 2026</sub>
</p>
