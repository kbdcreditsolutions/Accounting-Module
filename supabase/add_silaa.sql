-- Add Silaa (apparel & fashion) company and login.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- The company code 'silaa' tells the app to load the fashion-specific starter data
-- (items, sample clients, invoices) on Silaa's first login.

INSERT INTO companies (id, name, code, created_at)
VALUES (
  'b4e12f3a-7c91-4d58-ae23-9f0d6b8c5e71',
  'Silaa',
  'silaa',
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_users (id, company_id, username, password_hash, display_name, role, active, created_at)
VALUES (
  'e7f23c4b-1d82-5e69-bf34-0a1e7c9d6f82',
  'b4e12f3a-7c91-4d58-ae23-9f0d6b8c5e71',
  'Silaa',
  's2$1xgztVD3dhh/+ECOFH8GdQ==$82qY5e3mBo0LcamZtwzRKbSBsZjNeFOHa2f1D1Jb66U=',
  'Silaa Admin',
  'user',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;
