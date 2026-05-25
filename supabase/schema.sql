-- BirdieX — alert subscribers schema.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It is safe to re-run: every statement is idempotent.
--
-- Design notes:
--   * Row Level Security is ON and there are NO policies for the `anon` role,
--     so the public anon key CANNOT read, update, or delete the subscriber list.
--   * All public access goes through two SECURITY DEFINER functions:
--       subscribe(addr)   — add an email, or reactivate a prior unsubscribe
--       unsubscribe(token)— deactivate by per-subscriber token
--     These run with owner privileges but only ever touch the one matching row.
--   * The server-side notify script uses the SERVICE ROLE key, which bypasses
--     RLS, to read the active list.

create table if not exists public.subscribers (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null unique,
  created_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz,
  unsubscribe_token uuid        not null default gen_random_uuid()
);

alter table public.subscribers enable row level security;

-- Sign up (or re-activate). Lower-cases + trims the address; idempotent.
create or replace function public.subscribe(addr text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text := lower(trim(addr));
begin
  if clean !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return 'invalid';
  end if;
  insert into public.subscribers (email) values (clean)
  on conflict (email) do update set unsubscribed_at = null;
  return 'ok';
end;
$$;

-- Unsubscribe by the token embedded in each alert email's footer link.
create or replace function public.unsubscribe(token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscribers
     set unsubscribed_at = now()
   where unsubscribe_token = token
     and unsubscribed_at is null;
  return 'ok';
end;
$$;

-- The anon (public) role may ONLY call these two functions — nothing else.
revoke all on table public.subscribers from anon;
grant execute on function public.subscribe(text)   to anon;
grant execute on function public.unsubscribe(uuid) to anon;

-- ─── Lab (private backtest page) auth ─────────────────────────────────
-- Server-side password gate for /lab. Same pattern as the subscribers
-- table: the secret lives in a public table with RLS denying anon all
-- access, and the only thing anon can do is call a SECURITY DEFINER
-- verify function. The function uses pgcrypto's bcrypt to compare.
create extension if not exists pgcrypto;

create table if not exists public.lab_secrets (
  id            smallint primary key default 1,
  password_hash text     not null,
  constraint lab_secrets_single_row check (id = 1)
);

alter table public.lab_secrets enable row level security;
-- No policies for anon/authenticated → only service role can read.

-- Verify a password against the stored bcrypt hash. Returns true/false.
-- Defense-in-depth: if no hash is set yet, always returns false.
create or replace function public.verify_lab_password(pw text)
returns boolean
language plpgsql
security definer
-- pgcrypto installs `crypt()` into the `extensions` schema on Supabase,
-- so we MUST include it in the function's search_path. Locking it to
-- `public` alone breaks the function with 42883 (crypt does not exist).
set search_path = public, extensions
as $$
declare
  stored_hash text;
begin
  select password_hash into stored_hash from public.lab_secrets where id = 1;
  if stored_hash is null then
    return false;
  end if;
  return stored_hash = crypt(pw, stored_hash);
end;
$$;

-- anon can ONLY call the verify function — not read the table.
revoke all on table public.lab_secrets from anon;
revoke all on function public.verify_lab_password(text) from public;
grant execute on function public.verify_lab_password(text) to anon;
