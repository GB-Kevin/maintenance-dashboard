# Maintenance Dashboard (Next.js + Supabase)

This project provides a simple starting point for building a device maintenance dashboard with Next.js and Supabase. It includes:

- A Next.js App Router structure with TypeScript and Tailwind CSS.
- A pre‑configured Supabase client (`lib/supabaseClient.ts`).
- A dashboard page (`app/page.tsx`) that lets users track progress on a set of maintenance tasks, take notes, compute a score and save a report to Supabase.
- An admin page (`app/admin/page.tsx`) that lists saved reports in reverse chronological order.

## Getting started

1. **Install dependencies**

   Run the following commands in the project directory to install dependencies:

   ```sh
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key. You can find these values in the Supabase dashboard under **Settings → API → API Keys**. Do not commit your anon key to source control.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run the development server**

   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the dashboard. To access the admin page, visit `/admin`.

## Supabase setup

This project expects the following tables and policies to exist in your Supabase database. You can create them by running the SQL script below in the Supabase SQL editor:

```sql
-- Enable UUID extension if it isn't already
create extension if not exists "uuid-ossp";

-- Profiles table (optional, for admin flags)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- Devices table
create table if not exists public.devices (
  id uuid primary key default uuid_generate_v4(),
  owner text,
  device_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Reports table
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  owner text,
  device_name text,
  next_maintenance_at timestamp with time zone,
  completion_pct int,
  points int,
  created_at timestamp with time zone default now()
);

-- Report tasks table
create table if not exists public.report_tasks (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references public.reports(id) on delete cascade,
  task_id text,
  title text,
  category text,
  done boolean,
  note text
);

-- Enable Row Level Security
alter table public.devices enable row level security;
alter table public.reports enable row level security;
alter table public.report_tasks enable row level security;

-- Policies for owners
create policy "devices_own" on public.devices
  for all using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "reports_own" on public.reports
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "report_tasks_by_report" on public.report_tasks
  for all using (
    exists (select 1 from public.reports r where r.id = report_tasks.report_id and r.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.reports r where r.id = report_tasks.report_id and r.user_id = auth.uid())
  );

-- Admin policies
create policy "devices_admin" on public.devices
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "reports_admin" on public.reports
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "tasks_admin" on public.report_tasks
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
```

With these tables in place and the environment variables configured, you can sign in with GitHub, complete a maintenance checklist, and save reports directly into your Supabase database.

## Notes

- The dashboard uses GitHub OAuth for authentication. Ensure that GitHub is enabled as an auth provider in your Supabase project.
- The admin page currently lists reports but does not include comparison or editing capabilities; you can extend it as needed.
- Animations, badges and other UX improvements can be added using libraries like Framer Motion.