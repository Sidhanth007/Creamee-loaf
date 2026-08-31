# Creameè & Loaf — Home Bakery Ordering Platform

A full-stack, production-style e-commerce application for a home bakery, built as a portfolio project. Customers browse a live menu, verify their email with an OTP, order with delivery-slot booking and sandbox payments, request fully custom cakes, and leave verified-purchase reviews. A single secure admin dashboard manages the entire shop.

> **Demo project** — payments run exclusively in Razorpay **test mode** (or a built-in demo mode); no real money moves and no real orders are fulfilled.

## Features

**Customer storefront**
- Live menu from the database: search, category filters, product detail pages, eggless badges, sold-out states
- Email + password auth with **6-digit OTP email verification** (Brevo), secure HTTP-only JWT session cookies
- Profile and multi-address management (Indian PIN-code validation)
- Database-backed cart with quantity controls and a live header badge
- Checkout with **delivery date + time-slot booking** (per-slot daily capacity), order notes, delivery-fee rules (free above ₹999)
- **Razorpay test-mode payments** with server-side HMAC signature verification, falling back to a simulated demo payment when no keys are configured
- Order history with a visual status timeline and pre-confirmation cancellation
- **Custom cake requests**: occasion, size, flavour, egg/eggless, cake message, reference-image upload (Cloudinary), special instructions, needed-by date — with quoting workflow
- **Verified-purchase reviews** (star rating + comment) shown on product pages and menu cards
- **AI support assistant** — floating chat widget powered by Google Gemini, answering from live store data (menu, prices, availability, policies, and the signed-in customer's own orders) with prompt guardrails, rate limiting, and automatic model fallback

**Admin dashboard** (single admin, role-guarded at `/admin`)
- Overview analytics: revenue, order/customer counts, upcoming deliveries, top products, orders needing action
- Order pipeline management: Placed → Confirmed → Preparing → Out for delivery → Delivered (+ cancel), with legal-transition enforcement
- Product, category and delivery-slot CRUD with availability toggles
- Custom cake request review + quoting; review moderation (approve/hide/delete); customer directory with lifetime value

**Security**
- bcrypt password hashing, hashed OTPs with expiry/attempt caps/resend cooldown, login & registration rate limiting
- All prices and totals computed server-side; order snapshots survive product edits
- Zod validation on every input; ownership checks on every user-scoped action; role checks on every admin action

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, `proxy.ts`) + TypeScript |
| UI | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI), lucide-react icons |
| Database | PostgreSQL ([Neon](https://neon.tech) serverless) via Prisma 6 |
| Auth | Custom: bcryptjs + jose (JWT cookie sessions) + Brevo transactional email OTP |
| Payments | Razorpay Checkout (test mode) with server-side signature verification |
| Images | Cloudinary (signed uploads) for customer reference photos |
| AI chat | Google Gemini (free tier) with live database context |
| Validation | Zod |

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` (each service has a free tier, no card required):

| Variable | Where to get it | Required |
|---|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) → project → Connect (pooled string, hostname contains `-pooler`) | ✅ |
| `DIRECT_DATABASE_URL` | Same string with `-pooler` removed (used by migrations) | ✅ |
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` | ✅ |
| `ADMIN_EMAIL` | The one email address that becomes the admin on registration | ✅ |
| `BREVO_API_KEY` | [Brevo](https://brevo.com) → SMTP & API → API Keys (300 free emails/day) | Optional* |
| `BREVO_SENDER_EMAIL` | The email you signed up to Brevo with | Optional* |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | [Cloudinary](https://cloudinary.com) dashboard | Optional** |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | [Razorpay](https://razorpay.com) → Test Mode → API Keys | Optional*** |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — free, no card | Optional**** |

\* Without Brevo, OTP codes are printed to the dev-server console instead of emailed.
\** Without Cloudinary, the cake-request form simply hides the image-upload field.
\*** Without Razorpay, checkout uses a built-in simulated "demo payment".
\**** Without Gemini, the chat widget shows a friendly "coming soon" message.

### 3. Create and seed the database

```bash
npm run db:migrate   # creates all tables (11 models)
npm run db:seed      # 5 categories, 12 products, 4 delivery slots, 26 demo reviews
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000. Register with the email you set as `ADMIN_EMAIL` to get the **Admin** link in the header; any other email registers as a customer.

**Test payment (if Razorpay keys configured):** card `4111 1111 1111 1111`, any future expiry, any CVV.

## Project structure

```
src/
├── app/                       # Next.js App Router — every folder is a route
│   ├── (auth)/                # Route group (no URL segment): login, register, verify + auth actions
│   ├── account/               # Profile + address book (server actions in actions.ts)
│   ├── admin/                 # Admin dashboard (role-guarded in layout.tsx)
│   │   ├── orders/            #   order pipeline management
│   │   ├── products/          #   product CRUD (dialog components co-located)
│   │   ├── categories/        #   category CRUD
│   │   ├── slots/             #   delivery-slot CRUD
│   │   ├── cake-requests/     #   custom-cake quoting workflow
│   │   ├── reviews/           #   review moderation
│   │   ├── customers/         #   customer directory
│   │   └── actions.ts         #   ALL admin server actions (each calls requireAdmin)
│   ├── cart/                  # Cart page + cart server actions
│   ├── checkout/              # Checkout form, Razorpay flow, success page
│   ├── custom-cakes/          # Cake request form + "my requests" list
│   ├── menu/                  # Product grid, search/filters; [slug]/ = product page + reviews
│   ├── orders/                # Customer order history + [orderNumber]/ detail with timeline
│   ├── layout.tsx             # Root layout: fonts, header, footer, toaster
│   └── page.tsx               # Home: hero, featured products, categories
├── components/
│   ├── ui/                    # shadcn/ui primitives (button, card, dialog, table…)
│   ├── layout/                # Header (auth-aware) + footer
│   ├── products/              # ProductCard, ProductImage (fallback), AddToCart, RatingStars
│   ├── orders/                # OrderStatusBadge
│   └── auth/                  # Form error helpers
├── lib/
│   ├── site.ts                # ⭐ Brand config: name, tagline, currency, delivery fees
│   ├── db.ts                  # Prisma client singleton
│   ├── auth/                  # session (JWT cookie), password (bcrypt), otp (hashed codes)
│   ├── email/brevo.ts         # OTP email via Brevo API (console fallback in dev)
│   ├── razorpay.ts            # Order creation + HMAC signature verification
│   ├── cloudinary.ts          # Signed image uploads with type/size limits
│   ├── validation.ts          # Every Zod schema in one place
│   ├── orders.ts              # Status labels, legal transitions, date formatting
│   ├── rate-limit.ts          # In-memory fixed-window rate limiter
│   └── …                      # reviews.ts, cake-requests.ts, dates.ts
└── proxy.ts                   # Route protection (Next 16's middleware) for /account, /admin, /cart…

prisma/
├── schema.prisma              # 11 models: User, Address, OtpCode, Category, Product, CartItem,
│                              # DeliverySlot, Order, OrderItem, Review, CustomCakeRequest
├── migrations/                # Versioned SQL migrations
└── seed.ts                    # Idempotent seed (safe to re-run)
```

### Architectural conventions

- **Server Components by default** — pages fetch data directly with Prisma; client components (`"use client"`) exist only where interactivity demands it (forms, dialogs, cart stepper).
- **Server Actions for every mutation** — no REST API layer; forms post to co-located `actions.ts` files, validated with Zod, guarded with `getCurrentUser()` / `requireAdmin()`.
- **Money is integer paise** everywhere (₹749 = 74900) — no floating-point currency bugs.
- **Snapshots over references** — orders copy the address and product name/price at purchase time, so history survives edits and deletions.
- **One config file to rebrand** — everything brand-related lives in `src/lib/site.ts`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build + type checking |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply database migrations |
| `npm run db:seed` | Seed demo data (idempotent) |
| `npm run db:studio` | Prisma Studio — visual database browser |

## Deployment

Built Vercel-ready: import the repo at [vercel.com](https://vercel.com), add every `.env` variable in Project Settings → Environment Variables, and deploy. `postinstall` runs `prisma generate` automatically. Use the pooled Neon URL for `DATABASE_URL`.

## License

MIT — see [LICENSE](LICENSE).
