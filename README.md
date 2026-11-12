# NewsTeen75 Admin

Standalone Next.js dashboard. It does not contain or modify the Android application. Installation and builds never execute SQL or connect to production.

## Local setup

1. Use Node.js 20.9+ and npm. Run `npm install`.
2. Copy `.env.example` to `.env.local` and provide your Supabase URL, public anon/publishable key, and comma-separated `ADMIN_EMAIL_ALLOWLIST` of approved, confirmed Supabase Auth users. All three are required.
3. Run `npm run dev`; open http://localhost:3000/login.
4. Provision approved administrators using your existing Supabase Auth process. Disable public signups when not needed. The dashboard does not provision accounts.

Middleware and the dashboard layout verify sessions server-side. The allowlist is server-only; unapproved and unconfirmed users are denied. Configure Supabase Auth site URL and redirect allowlist for your deployment. Never use a service-role key in frontend configuration, repository, or environment variables for this project.

## Analytics and safety

The optional `supabase/dashboard-schema.sql` defines a security-invoker aggregation function, does not alter existing tables or policies, and is never run automatically. Review it, its permissions, query plans and existing RLS with your database administrator before manually installing. Never weaken RLS merely to make the dashboard work. RLS may hide rows and return an empty result even when events exist. The signed-in administrator needs appropriate existing read access; the dashboard does not use privileged credentials. Without the function, the UI explicitly says analytics is not configured. Errors do not result in fabricated numbers.

Dates use UTC. Unique counts use user ID if present, otherwise anonymous ID. An identity transition can cause double counting. Sessions without IDs are not counted. Metrics without reliable instrumentation are unavailable. This function can scan 90 days per request: review EXPLAIN and consider a secure aggregate pipeline before using at scale. It creates no indexes.

## Content and campaigns

Forms are previews only: no records, uploads, statuses or placements are saved. Build and review separate CMS tables, storage permissions, audit logs, validation, scheduling, authorization and mobile integration before enabling publishing. Sponsored content must remain visibly disclosed. This project does not change mobile feed or notification behavior.

## GitHub and Vercel

Create a **new private** GitHub repository named `newsteen75-admin`. From this folder run `git init`, inspect the files, make a commit and add the new repository as the remote. Never use the Android repository. Import the new repository into Vercel as a Next.js project, set the three environment variables, deploy, configure Supabase Auth URLs, and test approved and unapproved accounts. Never commit `.env.local` or credentials.

## Current limitations

The first build supports 7, 30 and 90 day chart ranges. Custom date ranges, comparisons, full content rankings, several detailed breakdowns, notification delivery data, app version distribution and CMS persistence are not implemented. Connection status confirms session/configuration, not analytics access. Production RLS, analytics correctness and performance need real-environment verification before use. No deployment, Supabase changes or Android builds have been performed.
