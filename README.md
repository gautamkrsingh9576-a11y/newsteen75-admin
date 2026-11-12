# NewsTeen75 Admin

Standalone Next.js dashboard. It does not contain or modify the Android application.

## Current access mode

The dashboard opens directly without a login screen.

## Analytics connection

Analytics are fetched only from the Next.js/Vercel server using:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

The secret key is server-only and must never be prefixed with `NEXT_PUBLIC_`, committed to GitHub, or placed in browser code.

The dashboard calls `public.dashboard_analytics_summary`, which returns aggregate metrics only. The SQL in `supabase/dashboard-schema.sql` revokes RPC execution from `public`, `anon`, and `authenticated` and grants it only to `service_role`.

## Safety

No destructive database operations are run by this repository.

The NewsTeen75 Android app, website, automation repository, existing feed logic, and existing production data are separate and are not modified by this dashboard.

## Content and campaigns

Forms are currently previews only. CMS persistence and campaign delivery will be implemented separately after analytics is verified.
