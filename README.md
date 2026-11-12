# NewsTeen75 Admin

Standalone Next.js dashboard. It does not contain or modify the Android application.

## Current access mode

The dashboard currently opens directly without a login screen or Supabase Auth gate.

Because there is no login protection, anyone who knows the deployed URL may be able to open the dashboard. Use Vercel deployment protection, a private network, or re-enable authentication later if access control is needed.

## Local setup

1. Use Node.js 20.9+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Provide:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Run `npm run dev`.

Never use a Supabase service-role key in browser-exposed environment variables.

## Analytics and safety

The optional `supabase/dashboard-schema.sql` defines a security-invoker aggregation function and is never run automatically.

The dashboard uses the public Supabase client configuration only. Existing Row Level Security remains in force. If the anonymous role cannot read the required analytics data or call the aggregation function, the dashboard will show an unavailable/empty state rather than bypass security.

No destructive database operations are run by this project.

## Content and campaigns

Forms are previews only. No records, uploads, statuses, or placements are saved until a separate CMS backend is implemented.

## Vercel

Import this repository into Vercel and set the two required environment variables above.

The NewsTeen75 Android app, website, and automation repositories are separate and are not changed by this dashboard.
