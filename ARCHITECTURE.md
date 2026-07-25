# Architecture Document

This document outlines the technical architecture for the AURA Campus Response and Action System.

## 1. System Overview

AURA is a web-based platform designed to be a trusted and transparent system for students to report issues and see them resolved. It consists of a frontend application for users, a backend server to handle business logic, a database for persistence, and an AI layer for intelligent features.

The architecture is designed to be:
- **Scalable:** To handle a growing number of users and data.
- **Maintainable:** With a clear separation of concerns.
- **Secure:** To protect user data and ensure anonymity.
- **Resilient:** To be available and reliable.

## 2. Architectural Style

AURA is built **Supabase-native**: the Next.js frontend talks directly to Supabase (Postgres + Row Level Security, Auth, Storage, Realtime, Edge Functions) as its backend-as-a-service. There is no parallel Node.js/microservices layer to operate — discrete pieces of business logic (escalation, notifications, AI calls) are implemented as Supabase Edge Functions rather than standalone services. This keeps the MVP serverless and minimizes infrastructure to run, while still giving a clear seam (Edge Functions) to extract a dedicated service later if a specific workload outgrows it.

## 3. High-Level Architecture Diagram

```
+-----------------+      +-----------------+      +-----------------+
|   Student App   |      |   Admin Panel   |      |   Public Board  |
| (Next.js)       |      | (Next.js)       |      | (Next.js)       |
+-----------------+      +-----------------+      +-----------------+
        |                      |                      |
        |          @supabase/supabase-js / @supabase/ssr           |
        |                      |                      |
+-------------------------------------------------------------+
|                          Supabase Platform                   |
|  +-----------+  +---------------+  +---------+  +---------+  |
|  |   Auth    |  | Postgres + RLS|  | Storage |  |Realtime |  |
|  +-----------+  +---------------+  +---------+  +---------+  |
|  +---------------------------------------------------------+ |
|  |                    Edge Functions (Deno)                 | |
|  |   escalation rules · notifications · AI categorization   | |
|  +---------------------------------------------------------+ |
+-------------------------------------------------------------+
        |
        | (optional, from an Edge Function)
        v
+-------------------------+
|  External LLM API       |
|  (categorisation,       |
|   sentiment analysis)   |
+-------------------------+
```

## 4. Frontend Architecture

- **Framework:** React with Next.js. This provides Server-Side Rendering (SSR) and Static Site Generation (SSG) which is good for performance and SEO for the public-facing parts of the application.
- **Language:** TypeScript for type safety.
- **Styling:** Tailwind CSS for a utility-first CSS framework.
- **State Management:** React Context or Zustand for simple state management.
- **Key Libraries:**
    - `@supabase/supabase-js` and `@supabase/ssr` for all data access, auth, and realtime subscriptions.
    - `react-hook-form` for forms.
    - `SWR` or `react-query` layered on top of `supabase-js` for client-side caching where useful.

## 5. Backend Architecture

AURA has no standalone backend server to deploy or operate — Supabase *is* the backend. What would otherwise be separate microservices are implemented as Supabase primitives:

- **Authentication** → **Supabase Auth**. Handles registration, login, sessions, and issues JWTs automatically; no custom auth service to build or run.
- **Issue Service** → **Postgres tables + Row Level Security (RLS) policies + Postgres functions/triggers**. Status transitions (`Submitted → Acknowledged → Assigned → In Progress → Resolved → Verified`) are enforced with triggers/check constraints rather than service-layer code.
- **Notification Service** → **Supabase Realtime** (subscribing to Postgres changes for in-app updates) plus an **Edge Function** that sends email/push on key state changes (e.g. via Resend).
- **Analytics Service** → **Postgres views** (or materialized views) that aggregate issue data for the Transparency Board, queried directly by the frontend.
- **Escalation logic** → an **Edge Function** invoked on a schedule (`pg_cron` / Supabase Scheduled Functions) that checks for issues past their SLA threshold and escalates them.
- **API:** Supabase's auto-generated REST API (PostgREST) and Realtime subscriptions cover standard CRUD and live updates. Edge Functions handle anything needing service-role privileges or third-party calls (e.g. sending email, calling an LLM). There is no separate API Gateway — Supabase's built-in auth + RLS enforcement at the database layer takes on that role.

## 6. Database Architecture

- **Database:** Supabase-managed PostgreSQL. Supports complex queries and JSON columns (`jsonb`) for flexible data like attachment metadata.
- **Data access:** `supabase-js` query builder using generated TypeScript types (`supabase gen types typescript`) for end-to-end type safety, instead of a separate ORM. Prisma or Drizzle can be layered on top of the same Postgres connection string later if the team wants richer migration tooling, but it is not required for the MVP.
- **Schema:** The data model from the PRD will be implemented. See `PRD.md` for details on the `Issue` and `User` tables. We will add more tables for `Comments`, `Attachments`, `Rewards`, etc.
- **Access control:** RLS policies (keyed on `auth.uid()` and a `role` claim) are the primary enforcement mechanism for who can read/write which rows — see §9 Security.

## 7. AI/ML Layer

AI features are "Nice to Have" for the MVP (see `PRD.md`) and are implemented without a standalone ML service:

- **Issue Categorization / Sentiment Analysis:** An Edge Function calls an external LLM API (e.g. Anthropic or OpenAI) with the issue description and returns a category/sentiment label to store on the row.
- **Duplicate Detection:** Supabase Postgres's native **pgvector** extension stores sentence embeddings per issue and performs similarity search directly in SQL — no separate vector database or Python service needed.
- **Future scope:** If heavier, custom-trained ML (e.g. fine-tuned classifiers) becomes necessary, a dedicated Python/FastAPI service can be introduced as an external system Edge Functions call into — but this is explicitly deferred past the MVP.

## 8. Deployment and Infrastructure

- **Hosting:**
    - **Frontend:** Vercel for the Next.js app, offering seamless deployment and CDN.
    - **Backend:** A managed Supabase project (separate staging and production projects) — no containers, orchestration, or servers to operate for the MVP.
- **CI/CD:** GitHub Actions runs `supabase db push` (or `supabase migration up`) to apply database migrations and Edge Function deploys, then triggers the Vercel deployment for the frontend.
- **Monitoring & Logging:** Supabase's built-in dashboard (Postgres logs, Auth logs, Edge Function logs, API usage) plus Vercel Analytics for the frontend. A dedicated Prometheus/Grafana/ELK stack is unnecessary at this scale and can be revisited only if self-hosting becomes necessary.

## 9. Security

- **Authentication:** Supabase Auth issues and verifies JWTs; no custom auth service to secure.
- **Authorization:** Postgres **Row Level Security (RLS)** policies, keyed on `auth.uid()` and a `role` claim (student, admin, faculty), are the primary Role-Based Access Control mechanism — enforced at the database layer, not just in application code.
- **Data Security:**
    - All communication is over HTTPS (enforced by Supabase and Vercel by default).
    - Data at rest is encrypted by Supabase's managed Postgres.
    - Anonymity is preserved via RLS: anonymous submissions are stored without a visible link between the submitter's identity and the public-facing issue row (identity is kept in a separate, restricted-access table only admins' RLS policies can join against).
- **Input Validation:** Postgres constraints/check constraints at the schema level, plus Zod validation in Next.js forms and Edge Functions, to prevent malformed or malicious input.
