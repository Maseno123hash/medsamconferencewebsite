-- ═══════════════════════════════════════════════════════════════════════
-- MEDSAM — Migration 2: Partners table + partner_logos bucket
-- Run this ONCE in the Supabase SQL editor (idempotent — safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  logo_path text,
  website text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partners enable row level security;

drop policy if exists "partners_public_select" on public.partners;
create policy "partners_public_select" on public.partners
  for select to anon, authenticated using (is_published = true);

drop policy if exists "partners_admin_all" on public.partners;
create policy "partners_admin_all" on public.partners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage bucket for partner logos (public read, admin write only)
insert into storage.buckets (id, name, public) values
  ('partner_logos', 'partner_logos', true)
on conflict (id) do nothing;

drop policy if exists "partner_logos_storage_public_select" on storage.objects;
create policy "partner_logos_storage_public_select" on storage.objects
  for select to anon, authenticated using (bucket_id = 'partner_logos');

drop policy if exists "partner_logos_storage_admin_all" on storage.objects;
create policy "partner_logos_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'partner_logos' and public.is_admin())
  with check (bucket_id = 'partner_logos' and public.is_admin());

-- DONE: public /partners page + Admin → Partners are now live.
