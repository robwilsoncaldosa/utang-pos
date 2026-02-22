# Utang POS — Project Specification & Implementation Plan

Internal web-based POS for company employees. Reference UI: dashboard with product grid, categories sidebar, and current order / checkout panel.

---

## 1. Project Overview

| Aspect | Description |
|--------|-------------|
| **Name** | Utang POS |
| **Users** | Employees with company email (e.g. `@mlhuilliercom`) |
| **Purpose** | Replace manual paper tracking; record sales, inventory, and credit (utang) in one place |
| **Auth** | Google OAuth only; email domain restriction; email as unique identifier |

### Core Flows

1. **Staff (POS)**  
   Browse products → Add to cart → Checkout → Choose **Paid** or **Credit (Utang)** → System records transaction, deducts stock, stores user email and payment type.

2. **Admin**  
   View transactions, unpaid credits, inventory, total sales; add/edit/delete products.

---

## 2. Tech Stack Recommendation

**Supabase is a strong fit** and aligns with your current stack.

| Layer | Recommendation | Notes |
|-------|----------------|--------|
| **Authentication** | **Supabase Auth** (Google OAuth) | Native Google provider; restrict to `@mlhuilliercom` in app or with custom rule. |
| **Database** | **Supabase (PostgreSQL)** | Products, categories, inventory, transactions, line items. RLS for security. |
| **Backend** | **Next.js API Routes + Supabase** | Server actions or Route Handlers for checkout; Supabase client/server for CRUD. No separate backend needed. |
| **Hosting** | **Vercel** (or similar) | Next.js + serverless; env vars for Supabase. |

**Why Supabase**

- One platform for auth + DB + optional real-time.
- Row Level Security (RLS) keeps data scoped by role (staff vs admin).
- Google OAuth built-in; you only need to enforce `email LIKE '%@mlhuilliercom'` and prevent duplicate sign-ups by email.
- No extra backend service to run; fits “internal web app” scope.

**Alternatives (if you outgrow Supabase)**  
Separate backend (e.g. Node/Express or Next API) + Postgres (e.g. Neon/Railway) + Auth0/Clerk for OAuth. For this project, Supabase is sufficient and simpler.

---

## 3. Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                               │
│  Next.js App Router · React · Shadcn UI · Tailwind                       │
├─────────────────────────────────────────────────────────────────────────┤
│  /              POS Dashboard (product grid, categories, cart)            │
│  /auth/login    Google OAuth only → redirect to / or /admin by role      │
│  /admin         Admin dashboard (transactions, credits, inventory, CRUD) │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js Server (Vercel)                             │
│  Server Components · Server Actions · Route Handlers (API)               │
│  - Session from Supabase cookies                                         │
│  - Enforce @mlhuilliercom after OAuth                                    │
│  - Check role (staff vs admin) for /admin                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Supabase                                         │
│  Auth (Google OAuth) · Postgres · Optional: Realtime / Edge Functions   │
│  RLS: staff read products/transactions; admin + write products/inventory │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data flow (checkout)**

1. User adds items to cart (client state or URL state).
2. Clicks “Review & Checkout” → Checkout modal (Paid vs Credit).
3. Server Action (or API route) runs in Next.js: validate session, check email domain, then:
   - Insert `transactions` row (user_email, payment_type, totals, timestamp).
   - Insert `transaction_items` rows.
   - Update `products.stock_quantity` (or dedicated `inventory` table) inside a transaction.

---

## 4. Database Schema

Use Supabase SQL Editor to run these in order.

### 4.1 Profiles (optional but recommended)

Links Supabase Auth to app roles and domain check.

```sql
-- Run after enabling Supabase Auth with Google
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  allowed_domain text not null default 'mlhuilliercom',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Only allow @mlhuilliercom (adjust domain as needed)
alter table public.profiles add constraint email_domain_check
  check (email ilike '%@mlhuilliercom');

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
```

Use a trigger or Supabase Auth hook to insert into `profiles` on first sign-up (and reject if email not like `%@mlhuilliercom` to prevent duplicates from other domains).

### 4.2 Categories

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Anyone authenticated can read categories"
  on public.categories for select
  to authenticated
  using (true);

create policy "Only admins can manage categories"
  on public.categories for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### 4.3 Products

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(12,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  barcode text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_category on public.products(category_id);
create index idx_products_name on public.products(name);
create index idx_products_barcode on public.products(barcode);

alter table public.products enable row level security;

create policy "Authenticated can read products"
  on public.products for select to authenticated using (true);

create policy "Only admins can insert/update/delete products"
  on public.products for all to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

### 4.4 Transactions

```sql
create type public.payment_type as enum ('paid', 'credit');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  payment_type public.payment_type not null,
  subtotal decimal(12,2) not null default 0,
  tax_pct decimal(5,2) not null default 12,
  tax_amount decimal(12,2) not null default 0,
  total_amount decimal(12,2) not null default 0,
  -- For credits: when paid off (optional)
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_created on public.transactions(created_at desc);
create index idx_transactions_payment_type on public.transactions(payment_type);

alter table public.transactions enable row level security;

create policy "Authenticated can read transactions"
  on public.transactions for select to authenticated using (true);

create policy "Authenticated can insert transactions (staff checkout)"
  on public.transactions for insert to authenticated with check (true);
```

### 4.5 Transaction items (line items)

```sql
create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price decimal(12,2) not null,
  line_total decimal(12,2) not null,
  created_at timestamptz default now()
);

create index idx_transaction_items_transaction on public.transaction_items(transaction_id);

alter table public.transaction_items enable row level security;

create policy "Authenticated can read transaction items"
  on public.transaction_items for select to authenticated using (true);

create policy "Authenticated can insert transaction items"
  on public.transaction_items for insert to authenticated with check (true);
```

### 4.6 Trigger: update product stock on transaction insert

```sql
create or replace function public.deduct_stock_on_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock_quantity = stock_quantity - new.quantity,
      updated_at = now()
  where id = new.product_id;
  if not found then
    raise exception 'Product not found';
  end if;
  return new;
end;
$$;

create trigger after_transaction_item_insert
  after insert on public.transaction_items
  for each row execute function public.deduct_stock_on_transaction();
```

(Add a check in the same function or in app logic that `stock_quantity` does not go negative; reserve stock in app before inserting if you want to prevent oversell.)

---

## 5. Folder Structure

Suggested layout that matches the dashboard reference and separates POS vs Admin.

```
utang-pos/
├── app/
│   ├── layout.tsx                 # Root layout (providers, fonts)
│   ├── page.tsx                   # POS dashboard (product grid + cart) — main user view
│   ├── globals.css
│   │
│   ├── auth/
│   │   ├── layout.tsx             # Auth shell (full-screen mobile, centered card desktop)
│   │   ├── login/page.tsx         # Google OAuth only
│   │   ├── confirm/route.ts       # Email OTP / redirect after OAuth
│   │   ├── error/page.tsx
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── layout.tsx             # Auth guard; redirect to /auth/login if not admin
│   │   ├── page.tsx               # Admin dashboard home (stats, links)
│   │   ├── products/              # Add / edit / delete products
│   │   │   ├── page.tsx           # List + actions
│   │   │   └── [id]/page.tsx      # Edit product
│   │   ├── transactions/page.tsx  # All transactions
│   │   ├── credits/page.tsx       # Unpaid credits (payment_type = credit, paid_at is null)
│   │   └── inventory/page.tsx    # Inventory levels (products.stock_quantity)
│   │
│   └── api/                       # Optional API routes (e.g. webhooks)
│       └── ...
│
├── components/
│   ├── ui/                        # Shadcn (button, card, input, dialog, etc.)
│   ├── auth-card.tsx
│   ├── login-form.tsx             # → Switch to Google OAuth only
│   │
│   ├── layout/
│   │   ├── header.tsx             # Logo (logo.svg), search bar
│   │   ├── pos-layout.tsx         # POS shell: header + sidebar + main + cart
│   │   └── admin-sidebar.tsx      # Admin nav
│   │
│   ├── pos/
│   │   ├── category-list.tsx      # Left sidebar: CATEGORIES, All, Drinks, …
│   │   ├── product-grid.tsx       # Product cards (image, stock badge, name, price, category)
│   │   ├── product-card.tsx       # Single product card, add to cart
│   │   ├── cart-sidebar.tsx       # Current Order: list, Clear, Subtotal, Tax, Total
│   │   ├── checkout-modal.tsx     # Review & Checkout → Paid / Credit (Utang)
│   │   └── search-bar.tsx         # “Search products by name or barcode…”
│   │
│   └── admin/
│       ├── stats-cards.tsx        # Total sales, unpaid credits, low stock
│       ├── transactions-table.tsx
│       ├── credits-table.tsx
│       ├── inventory-table.tsx
│       └── product-form.tsx       # Add/Edit product
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts          # Optional: protect /admin, refresh session
│   ├── utils.ts
│   └── constants.ts              # VAT 12%, domain allowlist
│
├── hooks/
│   ├── use-cart.ts                # Cart state (items, quantities, totals)
│   └── use-products.ts           # Fetch products by category, search
│
├── docs/
│   └── UTANG_POS_SPEC.md          # This file
│
├── .env.local                     # NEXT_PUBLIC_SUPABASE_*, Supabase keys
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 6. Dashboard Reference (UI Alignment)

From the reference image, the **user-facing POS** should match:

| Area | Implementation |
|------|----------------|
| **Header** | Logo (`logo.svg`) + “UTang POS” + centered search: “Search products by name or barcode…” |
| **Left sidebar** | “CATEGORIES” title; list (e.g. All, Drinks); “All” selected = blue background, white text. |
| **Main content** | Product grid: cards with image, **Stock: N** badge (e.g. red), name, **price** (e.g. P20.00, orange), category label. Rounded cards, subtle shadow on desktop. |
| **Right sidebar** | “Current Order” + cart icon; “Clear Order” (red); empty state: “Your cart is empty” + “Add products from the menu to start an order”; **Subtotal**, **Tax (12% VAT)**, **Total Amount** (bold blue); **Hold Order** (secondary), **Review & Checkout** (primary orange); optional help icon. |
| **Checkout modal** | Selected items, total price, option **Paid** or **Credit (Utang)**; confirm → run backend logic above. |
| **Mobile** | Full width/height; categories and cart as drawer/sheet or bottom bar so it feels native. |

Colors: blue (primary/links/selected category/total), orange (prices, checkout button), red (stock badge, clear order), grey (secondary text, borders).

---

## 7. Step-by-Step Implementation Plan

### Phase 1 — Auth & access

1. **Enable Google OAuth in Supabase**  
   Supabase Dashboard → Authentication → Providers → Google (Client ID/Secret from Google Cloud).

2. **Restrict to @mlhuilliercom**  
   - Option A: In app, after `signInWithOAuth`, check `user.email`; if not `*@mlhuilliercom`, sign out and show “Only company email allowed.”  
   - Option B: Supabase Auth Hook (or Edge Function) on sign-up: reject if email domain ≠ `mlhuilliercom`.  
   - Use email as unique identifier; no duplicate sign-up for same email (Supabase already enforces unique auth users).

3. **Profiles and roles**  
   Run `profiles` table + RLS. On first login (or via Auth hook), insert `profiles` row from `auth.users` and set `role` (e.g. first user = admin, rest = staff). Or manage admin in Supabase/Dashboard.

4. **Switch login UI to Google only**  
   Replace email/password form with a single “Sign in with Google” button; remove sign-up for non-Google. Redirect staff to `/` (POS), admin to `/admin` (or both to `/` and show admin link only to admins).

5. **Guard /admin**  
   In `app/admin/layout.tsx`, ensure user is authenticated and `profiles.role = 'admin'`; else redirect to `/auth/login`.

### Phase 2 — Data and POS shell

6. **Run schema**  
   Create `categories`, `products`, `transactions`, `transaction_items` and RLS policies; add stock-deduction trigger.

7. **Seed data (optional)**  
   Insert a few categories (e.g. “All”, “Drinks”) and products (name, price, stock, category) for testing.

8. **POS layout**  
   Build `app/page.tsx` with `Header` (logo + search), `CategoryList` (left), main area for product grid, `CartSidebar` (right). Use your existing Shadcn + Tailwind; match dashboard reference (colors, spacing, “Current Order”, “Clear Order”, Subtotal/Tax/Total, Hold Order + Review & Checkout).

9. **Product listing**  
   Fetch products (and categories) from Supabase in Server Components or via `useProducts` (category filter, search by name/barcode). Build `ProductCard` (image, stock badge, name, price, category, add to cart).

10. **Cart state**  
    Implement `useCart` (e.g. React state or context): add/remove/update quantity; compute subtotal, tax (12%), total. Persist “Hold Order” in DB or localStorage if needed.

### Phase 3 — Checkout and transactions

11. **Checkout modal**  
    “Review & Checkout” opens a modal: list cart items, total, and two options: **Paid** / **Credit (Utang)**. On confirm, call a Server Action (or API route).

12. **Checkout Server Action**  
    - Validate session and cart (quantities vs `products.stock_quantity`).  
    - Begin transaction: insert `transactions` (user_id, user_email, payment_type, subtotal, tax, total), insert `transaction_items` (trigger will deduct stock).  
    - Return success; clear cart and show confirmation.

13. **Hold Order (optional)**  
    Save cart to DB (e.g. `held_orders` table or JSON in `profiles`) or localStorage; restore when user returns.

### Phase 4 — Admin dashboard

14. **Admin home**  
    `app/admin/page.tsx`: summary cards (total sales, unpaid credits count, low stock count); links to Transactions, Credits, Inventory, Products.

15. **Transactions list**  
    `app/admin/transactions/page.tsx`: table (date, user_email, payment_type, total, link to detail). Filter by date, payment type.

16. **Unpaid credits**  
    `app/admin/credits/page.tsx`: list transactions where `payment_type = 'credit'` and `paid_at is null`. Option to “Mark as paid” (set `paid_at`).

17. **Inventory**  
    `app/admin/inventory/page.tsx`: list products with `stock_quantity`; alert or highlight low stock (e.g. &lt; 5). Admin can adjust stock (update `products.stock_quantity`).

18. **Product CRUD**  
    `app/admin/products/page.tsx`: table of products; add new product; `app/admin/products/[id]/page.tsx`: edit name, price, category, image_url, stock, barcode. Delete with confirmation. Use RLS so only admin can insert/update/delete.

### Phase 5 — Polish

19. **Search**  
    Header search: filter products by name or barcode (client-side or server-side).

20. **Mobile responsive**  
    Categories and cart as drawers/sheets; product grid single column; full-width/height so it feels native.

21. **Error handling and loading**  
    Toasts or inline messages for “Insufficient stock”, “Checkout failed”; loading states for product list and checkout.

22. **Vercel deployment**  
    Set env vars (Supabase URL, anon key, maybe service role for admin-only operations if needed). Add Supabase redirect URL for production domain.

---

## 8. Summary

| Deliverable | Location |
|-------------|----------|
| **Architecture** | §3 (diagram + data flow) |
| **Database schema** | §4 (SQL for profiles, categories, products, transactions, transaction_items, trigger) |
| **Folder structure** | §5 |
| **Implementation steps** | §7 (Phases 1–5) |
| **Dashboard reference** | §6 (header, sidebars, product grid, cart, checkout, colors) |

Using **Supabase for Auth + Postgres**, **Next.js for UI and server logic**, and **Shadcn + Tailwind** for the dashboard keeps the stack simple and matches the reference design while satisfying authentication, product listing, checkout (Paid/Credit), inventory, and admin requirements.
