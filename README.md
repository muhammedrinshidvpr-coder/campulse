# AURA — Campus Response and Action System

A campus accountability platform that converts student feedback into visible action, trust, and participation. ("Campulse" is this repo's package/slug name for the same project.)

See the full docs for context before making changes:
- [`PRD.md`](./PRD.md) — product requirements, scope, and success metrics
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — technical architecture
- [`DESIGN.md`](./DESIGN.md) — UI/UX design system and wireframes

## Tech Stack

- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS**
- **Supabase** for the backend: Postgres (with Row Level Security), Auth, Storage, Realtime, and Edge Functions

> **Note:** This project pins a non-standard Next.js major version with breaking changes from what you may expect. Read [`AGENTS.md`](./AGENTS.md) before writing code — it points to the bundled docs for this version.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com), then create a `.env.local` file in the project root with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   The anon key is safe to expose to the browser. The **service role key is server-only** — never expose it in client-side code or commit it to git (`.env*` is already gitignored).

3. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the result. You can start editing the page by modifying `app/page.tsx` — it auto-updates as you edit.

## Deployment

- **Frontend:** deploy to [Vercel](https://vercel.com), with the same environment variables configured in the project settings.
- **Backend:** use separate Supabase projects for staging and production; apply schema changes with the Supabase CLI (`supabase db push` / `supabase migration up`).
