-- ============================================================
-- KBD Books — one-time setup for Supabase
-- Paste this whole file into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (idempotent).
-- ============================================================

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  username      text unique not null,
  password_hash text not null,
  display_name  text,
  role          text not null default 'user' check (role in ('superadmin','user')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.company_state (
  company_id uuid primary key references public.companies(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Lock everything down: RLS on with no policies means the public/anon key
-- can read nothing. The app's serverless API uses the secret key, which
-- bypasses RLS. Never put the secret key in browser code.
alter table public.companies     enable row level security;
alter table public.app_users     enable row level security;
alter table public.sessions      enable row level security;
alter table public.company_state enable row level security;

-- ---------- Seed companies ----------
insert into public.companies (id, name, code) values
  ('6d6c00f1-b16a-47bb-b55f-16164a42a759', 'KBD Credit Solutions',  'kbd'),
  ('0023ceee-dcd6-48a7-83f7-11127a939ba8', 'SRIDATRI PHYSIO CARE', 'sridatri')
on conflict (code) do nothing;

-- ---------- Seed logins ----------
-- Admin    / Admin@2026     → superadmin, KBD Credit Solutions
-- Sridatri / Sridatri@2026  → user, SRIDATRI PHYSIO CARE
insert into public.app_users (id, company_id, username, password_hash, display_name, role, active) values
  ('ad45e87b-e75b-426a-8edf-3ef7dd1674ff',
   '6d6c00f1-b16a-47bb-b55f-16164a42a759',
   'Admin',
   's2$993JdJGtNHGfSdHUagwBhw==$GyL932JwXDMvc/f+zO47uY6SwwjXou9XbkptEyyCS60=',
   'KBD Admin', 'superadmin', true),
  ('d09b4090-0c3f-476a-9820-7575c2e7af09',
   '0023ceee-dcd6-48a7-83f7-11127a939ba8',
   'Sridatri',
   's2$soc0EMIyP8HutrudBBBs+Q==$NR6Gpzn9TaNYkI3MuKcYpBhoGdi5PdV+jKXdvK5sk5I=',
   'Sridatri Physio Care', 'user', true)
on conflict (username) do nothing;

-- Company books are created automatically on each company's first login.
