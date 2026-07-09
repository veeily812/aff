# Affiliate Blog

A blog-style site for embedding affiliate products (image, description, price, affiliate link) inline in posts, with a password-protected admin dashboard for managing products and posts.

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database:** Postgres via [Supabase](https://supabase.com)
- **Image storage:** Supabase Storage
- **Admin auth:** single-password session (no multi-user accounts)
- **Hosting target:** Vercel

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Database:** Project Settings -> Database -> Connect -> "ORMs" tab. Supabase's direct-connection host is IPv6-only, which fails to connect from most local networks and some CI runners — use the **pooler** connection strings instead:
   - `DATABASE_URL` — the **Transaction pooler** URI (port 6543, `?pgbouncer=true`) — used by the running app.
   - `DIRECT_URL` — the **Session pooler** URI (port 5432) — used for running migrations (transaction-mode pooling doesn't support the operations `prisma migrate` needs).
3. **API keys:** Project Settings -> API. Copy the Project URL, publishable/anon key, and secret/service_role key.
4. **Storage:** Storage -> Create a new bucket named `product-images` and make it **public** (so product images are viewable without signed URLs).

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

- `DATABASE_URL` / `DIRECT_URL` — Supabase Postgres pooler connection strings (see above)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — from Supabase API settings
- `SUPABASE_STORAGE_BUCKET` — bucket name (`product-images` by default)
- `ADMIN_PASSWORD_HASH` — generate with:
  ```bash
  npm run hash-password -- "your-chosen-password"
  ```
  bcrypt hashes contain `$` characters, and Next.js expands `$VAR` syntax in `.env` files — escape every `$` as `\$` in the value or the hash will get silently truncated.
- `SESSION_SECRET` — any random string 32+ characters, e.g. `openssl rand -base64 32`

## 3. Install dependencies and set up the database

```bash
npm install
npx prisma migrate dev --name init
```

This creates the `Product` and `Post` tables in your Supabase database.

## 4. Run locally

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin dashboard: [http://localhost:3000/admin/login](http://localhost:3000/admin/login) (log in with the password you hashed above)

## How content works

- **Products** (`/admin/products`) each have a name, description, optional price, an uploaded image, and an affiliate URL.
- **Posts** (`/admin/posts`) are written in Markdown. Use the product picker above the body field to insert a product card anywhere in the text — it inserts a `[[product:<id>]]` token, which renders as a full product card (image, description, price, "Check Price" button) on the public post page.
- Only posts with **Published** checked are visible on the public site.

### Bulk importing products

`/admin/products/import` (also linked from the Products page) lets you bulk-create products from:

- An **Excel (.xlsx) or CSV file** upload
- A **public Google Sheets link** (the sheet must be shared as "Anyone with the link" or published to the web — the app fetches its CSV export, it doesn't use Google's API/OAuth)

Expected columns (case-insensitive, common aliases like `title`/`desc`/`link`/`photo` are recognized too): `name`, `description`, `price` (optional), `affiliateUrl`, `imageUrl` (a direct link to an image — not a file, since this is a spreadsheet). Rows are validated and previewed before anything is created; invalid rows are shown with their errors and excluded from import.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add all variables from `.env` as Vercel Environment Variables.
3. Vercel will run `npm run build`, which runs `prisma generate` automatically before `next build`.
4. Run `npx prisma migrate deploy` (locally, pointed at the production `DATABASE_URL`, or via a CI step) before the first deploy so the production database has the schema.
