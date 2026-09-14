-- ═══════════════════════════════════════════════════════════════════════
-- MEDSAM Scientific Conference & Symposium — Initial Database Migration
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Creates: tables, indexes, RLS policies, storage buckets + policies,
-- the public registration lookup function, and default config.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────────────────── 1. CONFIG ───────────────────────────
create table if not exists public.config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.config (key, value) values
  ('site', '{
    "currency": "USD",
    "studentStandard": 50,
    "nonStudentStandard": 90,
    "earlyBirdStudent": 40,
    "earlyBirdNonStudent": null,
    "earlyBirdDeadline": "2026-12-31T23:59:59Z",
    "workshopFee": null,
    "socials": {"facebook":"","instagram":"","x":"","youtube":"","linkedin":"","website":""},
    "contactEmail": "medsamscientifcconferenceorga@gmail.com",
    "contactPhones": ["+254 115 705 403", "+254 742 332 660"]
  }'::jsonb)
on conflict (key) do nothing;

-- ─────────────────────── 2. ADMIN PROFILES ───────────────────────
create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users (id) on delete cascade,
  role text not null default 'admin',
  full_name text,
  created_at timestamptz not null default now()
);

-- Helper: is the current Supabase user an authorised admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ─────────────────────── 3. REGISTRATIONS ───────────────────────
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null,
  full_name text not null,
  email text not null,
  phone text not null,
  country text,
  institution text,
  school_faculty text,
  department text,
  year_of_study text,
  category text not null,
  event_selection text not null check (event_selection in ('workshop','conference','both')),
  tier text not null check (tier in ('early_bird','standard')),
  amount numeric(10,2) not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','payment_submitted','payment_confirmed','registration_confirmed','cancelled')),
  communication_consent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists registrations_email_idx on public.registrations (lower(email));
create index if not exists registrations_status_idx on public.registrations (status);

-- ───────────────────────── 4. PAYMENTS ─────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  method text not null check (method in ('mpesa','bank_transfer','cash','other')),
  amount numeric(10,2) not null,
  transaction_ref text,
  paid_on date,
  proof_path text,
  status text not null default 'submitted' check (status in ('submitted','confirmed','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_registration_idx on public.payments (registration_id);

-- ───────────────────── 5. ABSTRACT SUBMISSIONS ─────────────────
create table if not exists public.abstract_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id text unique not null,
  author_name text not null,
  email text not null,
  phone text,
  institution text not null,
  department text,
  abstract_title text not null,
  authors text,
  track text not null,
  presentation_preference text not null default 'either' check (presentation_preference in ('oral','poster','either')),
  abstract_text text not null,
  keywords text,
  pdf_path text,
  status text not null default 'submitted'
    check (status in ('submitted','under_review','accepted','revision_required','rejected','oral','poster')),
  reviewer_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists abstracts_email_idx on public.abstract_submissions (lower(email));
create index if not exists abstracts_status_idx on public.abstract_submissions (status);

-- ─────────────────── 6. POSTER SUBMISSIONS ─────────────────────
create table if not exists public.poster_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  team_members text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  institution text,
  track text,
  poster_pdf_path text,
  poster_image_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────── 7. INNOVATION SUBMISSIONS ───────────────────
create table if not exists public.innovation_submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  team_members text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  institution text,
  track text,
  materials_path text,
  image_path text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────── 8. SPONSORS ───────────────────────────
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  pkg text not null default 'bronze',
  logo_path text,
  website text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsor_applications (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  contact_person text not null,
  email text not null,
  phone text,
  organisation_type text,
  preferred_package text,
  message text,
  status text not null default 'pending' check (status in ('pending','contacted','confirmed','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exhibitor_applications (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  contact_person text not null,
  email text not null,
  phone text,
  organisation_type text,
  products_services text,
  exhibition_requirements text,
  preferred_package text,
  message text,
  status text not null default 'pending' check (status in ('pending','contacted','confirmed','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────── 9. DONATIONS ──────────────────────────
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  name_or_org text not null,
  email text,
  phone text,
  amount numeric(10,2) not null,
  payment_method text,
  transaction_ref text,
  message text,
  proof_path text,
  status text not null default 'submitted' check (status in ('submitted','confirmed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────── 10. PUBLIC CONTENT ──────────────────────
create table if not exists public.speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  institution text,
  biography text,
  topic text,
  photo_path text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programme_items (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  time text,
  title text not null,
  description text,
  category text not null default 'session'
    check (category in ('opening','keynote','session','oral','poster','innovation','panel','break','awards','closing','other')),
  location text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text not null default 'main_conference'
    check (category in ('pre_conference','main_conference','presentations','innovation','networking','sponsors','other')),
  media_type text not null default 'image' check (media_type in ('image','video')),
  file_path text,
  video_url text,
  caption text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null default 'notice' check (type in ('notice','registration','abstract','speaker','programme','urgent')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────── 11. PUBLIC REGISTRATION LOOKUP (RPC) ──────────
-- Lets a delegate view their own confirmation with ref + email
-- WITHOUT a general read on the private registrations table.
create or replace function public.get_registration_public(p_ref_code text, p_email text)
returns table (
  ref_code text,
  full_name text,
  email text,
  category text,
  event_selection text,
  tier text,
  amount numeric,
  status text,
  payment_method text,
  payment_ref text,
  payment_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.ref_code,
    r.full_name,
    r.email,
    r.category,
    r.event_selection,
    r.tier,
    r.amount,
    r.status,
    p.method,
    p.transaction_ref,
    p.status,
    r.created_at
  from public.registrations r
  left join public.payments p on p.registration_id = r.id
  where r.ref_code = upper(coalesce(p_ref_code, ''))
    and lower(r.email) = lower(coalesce(p_email, ''))
  limit 1;
$$;

revoke execute on function public.get_registration_public(text, text) from public;
grant execute on function public.get_registration_public(text, text) to anon, authenticated;

-- ─────────────────────────── 12. RLS ───────────────────────────
alter table public.config              enable row level security;
alter table public.admin_profiles      enable row level security;
alter table public.registrations       enable row level security;
alter table public.payments            enable row level security;
alter table public.abstract_submissions enable row level security;
alter table public.poster_submissions  enable row level security;
alter table public.innovation_submissions enable row level security;
alter table public.sponsors            enable row level security;
alter table public.sponsor_applications enable row level security;
alter table public.exhibitor_applications enable row level security;
alter table public.donations           enable row level security;
alter table public.speakers            enable row level security;
alter table public.programme_items     enable row level security;
alter table public.gallery_items       enable row level security;
alter table public.announcements       enable row level security;
alter table public.contact_messages    enable row level security;

-- config: public read, admin write
drop policy if exists "config_public_read" on public.config;
create policy "config_public_read" on public.config for select to anon, authenticated using (true);
drop policy if exists "config_admin_write" on public.config;
create policy "config_admin_write" on public.config for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_profiles: user reads/updates their own row; admin manages all
drop policy if exists "admin_profiles_own" on public.admin_profiles;
create policy "admin_profiles_own" on public.admin_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin_profiles_admin_insert" on public.admin_profiles;
create policy "admin_profiles_admin_insert" on public.admin_profiles for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_profiles_admin_update" on public.admin_profiles;
create policy "admin_profiles_admin_update" on public.admin_profiles for update to authenticated using (public.is_admin());
drop policy if exists "admin_profiles_admin_delete" on public.admin_profiles;
create policy "admin_profiles_admin_delete" on public.admin_profiles for delete to authenticated using (public.is_admin());

-- registrations: anyone can create (no account); only admins read/update/delete
drop policy if exists "registrations_public_insert" on public.registrations;
create policy "registrations_public_insert" on public.registrations
  for insert to anon, authenticated with check (true);
drop policy if exists "registrations_admin_select" on public.registrations;
create policy "registrations_admin_select" on public.registrations for select to authenticated using (public.is_admin());
drop policy if exists "registrations_admin_update" on public.registrations;
create policy "registrations_admin_update" on public.registrations for update to authenticated using (public.is_admin());
drop policy if exists "registrations_admin_delete" on public.registrations;
create policy "registrations_admin_delete" on public.registrations for delete to authenticated using (public.is_admin());

-- payments: delegates submit; admins manage
drop policy if exists "payments_public_insert" on public.payments;
create policy "payments_public_insert" on public.payments for insert to anon, authenticated with check (true);
drop policy if exists "payments_admin_select" on public.payments;
create policy "payments_admin_select" on public.payments for select to authenticated using (public.is_admin());
drop policy if exists "payments_admin_update" on public.payments;
create policy "payments_admin_update" on public.payments for update to authenticated using (public.is_admin());
drop policy if exists "payments_admin_delete" on public.payments;
create policy "payments_admin_delete" on public.payments for delete to authenticated using (public.is_admin());

-- abstracts: anyone submits; only admins see them (private until review)
drop policy if exists "abstracts_public_insert" on public.abstract_submissions;
create policy "abstracts_public_insert" on public.abstract_submissions
  for insert to anon, authenticated with check (true);
drop policy if exists "abstracts_admin_select" on public.abstract_submissions;
create policy "abstracts_admin_select" on public.abstract_submissions for select to authenticated using (public.is_admin());
drop policy if exists "abstracts_admin_update" on public.abstract_submissions;
create policy "abstracts_admin_update" on public.abstract_submissions for update to authenticated using (public.is_admin());
drop policy if exists "abstracts_admin_delete" on public.abstract_submissions;
create policy "abstracts_admin_delete" on public.abstract_submissions for delete to authenticated using (public.is_admin());

-- posters: public can read ONLY approved rows; admins manage
drop policy if exists "posters_public_select" on public.poster_submissions;
create policy "posters_public_select" on public.poster_submissions
  for select to anon, authenticated using (status = 'approved');
drop policy if exists "posters_public_insert" on public.poster_submissions;
create policy "posters_public_insert" on public.poster_submissions for insert to anon, authenticated with check (true);
drop policy if exists "posters_admin_select" on public.poster_submissions;
create policy "posters_admin_select" on public.poster_submissions for select to authenticated using (public.is_admin());
drop policy if exists "posters_admin_update" on public.poster_submissions;
create policy "posters_admin_update" on public.poster_submissions for update to authenticated using (public.is_admin());
drop policy if exists "posters_admin_delete" on public.poster_submissions;
create policy "posters_admin_delete" on public.poster_submissions for delete to authenticated using (public.is_admin());

-- innovations: same model
drop policy if exists "innovations_public_select" on public.innovation_submissions;
create policy "innovations_public_select" on public.innovation_submissions
  for select to anon, authenticated using (status = 'approved');
drop policy if exists "innovations_public_insert" on public.innovation_submissions;
create policy "innovations_public_insert" on public.innovation_submissions for insert to anon, authenticated with check (true);
drop policy if exists "innovations_admin_select" on public.innovation_submissions;
create policy "innovations_admin_select" on public.innovation_submissions for select to authenticated using (public.is_admin());
drop policy if exists "innovations_admin_update" on public.innovation_submissions;
create policy "innovations_admin_update" on public.innovation_submissions for update to authenticated using (public.is_admin());
drop policy if exists "innovations_admin_delete" on public.innovation_submissions;
create policy "innovations_admin_delete" on public.innovation_submissions for delete to authenticated using (public.is_admin());

-- sponsors (display wall): public reads published; admins manage
drop policy if exists "sponsors_public_select" on public.sponsors;
create policy "sponsors_public_select" on public.sponsors for select to anon, authenticated using (is_published = true);
drop policy if exists "sponsors_admin_all" on public.sponsors;
create policy "sponsors_admin_all" on public.sponsors for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- sponsor applications: anyone applies; only admins read/update
drop policy if exists "sponsor_apps_public_insert" on public.sponsor_applications;
create policy "sponsor_apps_public_insert" on public.sponsor_applications for insert to anon, authenticated with check (true);
drop policy if exists "sponsor_apps_admin_select" on public.sponsor_applications;
create policy "sponsor_apps_admin_select" on public.sponsor_applications for select to authenticated using (public.is_admin());
drop policy if exists "sponsor_apps_admin_update" on public.sponsor_applications;
create policy "sponsor_apps_admin_update" on public.sponsor_applications for update to authenticated using (public.is_admin());
drop policy if exists "sponsor_apps_admin_delete" on public.sponsor_applications;
create policy "sponsor_apps_admin_delete" on public.sponsor_applications for delete to authenticated using (public.is_admin());

-- exhibitor applications: same model
drop policy if exists "exhibitor_apps_public_insert" on public.exhibitor_applications;
create policy "exhibitor_apps_public_insert" on public.exhibitor_applications for insert to anon, authenticated with check (true);
drop policy if exists "exhibitor_apps_admin_select" on public.exhibitor_applications;
create policy "exhibitor_apps_admin_select" on public.exhibitor_applications for select to authenticated using (public.is_admin());
drop policy if exists "exhibitor_apps_admin_update" on public.exhibitor_applications;
create policy "exhibitor_apps_admin_update" on public.exhibitor_applications for update to authenticated using (public.is_admin());
drop policy if exists "exhibitor_apps_admin_delete" on public.exhibitor_applications;
create policy "exhibitor_apps_admin_delete" on public.exhibitor_applications for delete to authenticated using (public.is_admin());

-- donations: anyone contributes; only admins read/update
drop policy if exists "donations_public_insert" on public.donations;
create policy "donations_public_insert" on public.donations for insert to anon, authenticated with check (true);
drop policy if exists "donations_admin_select" on public.donations;
create policy "donations_admin_select" on public.donations for select to authenticated using (public.is_admin());
drop policy if exists "donations_admin_update" on public.donations;
create policy "donations_admin_update" on public.donations for update to authenticated using (public.is_admin());
drop policy if exists "donations_admin_delete" on public.donations;
create policy "donations_admin_delete" on public.donations for delete to authenticated using (public.is_admin());

-- speakers: public reads published; admins manage
drop policy if exists "speakers_public_select" on public.speakers;
create policy "speakers_public_select" on public.speakers for select to anon, authenticated using (is_published = true);
drop policy if exists "speakers_admin_all" on public.speakers;
create policy "speakers_admin_all" on public.speakers for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- programme_items: public reads published; admins manage
drop policy if exists "programme_public_select" on public.programme_items;
create policy "programme_public_select" on public.programme_items for select to anon, authenticated using (is_published = true);
drop policy if exists "programme_admin_all" on public.programme_items;
create policy "programme_admin_all" on public.programme_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- gallery_items: public reads published; admins manage
drop policy if exists "gallery_public_select" on public.gallery_items;
create policy "gallery_public_select" on public.gallery_items for select to anon, authenticated using (is_published = true);
drop policy if exists "gallery_admin_all" on public.gallery_items;
create policy "gallery_admin_all" on public.gallery_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- announcements: public reads active/in-window; admins manage
drop policy if exists "announcements_public_select" on public.announcements;
create policy "announcements_public_select" on public.announcements
  for select to anon, authenticated
  using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
drop policy if exists "announcements_admin_all" on public.announcements;
create policy "announcements_admin_all" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- contact_messages: anyone sends; only admins read/update/delete
drop policy if exists "messages_public_insert" on public.contact_messages;
create policy "messages_public_insert" on public.contact_messages for insert to anon, authenticated with check (true);
drop policy if exists "messages_admin_select" on public.contact_messages;
create policy "messages_admin_select" on public.contact_messages for select to authenticated using (public.is_admin());
drop policy if exists "messages_admin_update" on public.contact_messages;
create policy "messages_admin_update" on public.contact_messages for update to authenticated using (public.is_admin());
drop policy if exists "messages_admin_delete" on public.contact_messages;
create policy "messages_admin_delete" on public.contact_messages for delete to authenticated using (public.is_admin());

-- ─────────────────── 13. STORAGE BUCKETS ───────────────────────
insert into storage.buckets (id, name, public) values
  ('abstracts', 'abstracts', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('payment_proofs', 'payment_proofs', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('posters', 'posters', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('innovations', 'innovations', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('gallery', 'gallery', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('sponsor_logos', 'sponsor_logos', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values
  ('speaker_photos', 'speaker_photos', true)
on conflict (id) do nothing;

-- Helpers: is this storage object part of an APPROVED public item?
create or replace function public.is_approved_poster_object(obj_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.poster_submissions p
    where p.status = 'approved'
      and (p.poster_pdf_path = obj_name or p.poster_image_path = obj_name)
  );
$$;

create or replace function public.is_approved_innovation_object(obj_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.innovation_submissions i
    where i.status = 'approved'
      and (i.materials_path = obj_name or i.image_path = obj_name)
  );
$$;

grant execute on function public.is_approved_poster_object(text) to anon, authenticated;
grant execute on function public.is_approved_innovation_object(text) to anon, authenticated;

-- ── abstracts (PRIVATE): delegates upload, admins read ──
drop policy if exists "abstracts_storage_public_insert" on storage.objects;
create policy "abstracts_storage_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'abstracts');
drop policy if exists "abstracts_storage_admin_select" on storage.objects;
create policy "abstracts_storage_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'abstracts' and public.is_admin());
drop policy if exists "abstracts_storage_admin_delete" on storage.objects;
create policy "abstracts_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'abstracts' and public.is_admin());

-- ── payment_proofs (PRIVATE): delegates upload, admins read ──
drop policy if exists "proofs_storage_public_insert" on storage.objects;
create policy "proofs_storage_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'payment_proofs');
drop policy if exists "proofs_storage_admin_select" on storage.objects;
create policy "proofs_storage_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment_proofs' and public.is_admin());
drop policy if exists "proofs_storage_admin_delete" on storage.objects;
create policy "proofs_storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment_proofs' and public.is_admin());

-- ── posters (public ONLY for approved rows; anyone uploads; admin all) ──
drop policy if exists "posters_storage_public_insert" on storage.objects;
create policy "posters_storage_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'posters');
drop policy if exists "posters_storage_public_select_approved" on storage.objects;
create policy "posters_storage_public_select_approved" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'posters' and public.is_approved_poster_object(name));
drop policy if exists "posters_storage_admin_all" on storage.objects;
create policy "posters_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'posters' and public.is_admin())
  with check (bucket_id = 'posters' and public.is_admin());

-- ── innovations (public ONLY for approved rows) ──
drop policy if exists "innovations_storage_public_insert" on storage.objects;
create policy "innovations_storage_public_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'innovations');
drop policy if exists "innovations_storage_public_select_approved" on storage.objects;
create policy "innovations_storage_public_select_approved" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'innovations' and public.is_approved_innovation_object(name));
drop policy if exists "innovations_storage_admin_all" on storage.objects;
create policy "innovations_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'innovations' and public.is_admin())
  with check (bucket_id = 'innovations' and public.is_admin());

-- ── gallery (public read; admin write only) ──
drop policy if exists "gallery_storage_public_select" on storage.objects;
create policy "gallery_storage_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'gallery');
drop policy if exists "gallery_storage_admin_all" on storage.objects;
create policy "gallery_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());

-- ── sponsor_logos (public read; admin write only) ──
drop policy if exists "logos_storage_public_select" on storage.objects;
create policy "logos_storage_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'sponsor_logos');
drop policy if exists "logos_storage_admin_all" on storage.objects;
create policy "logos_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'sponsor_logos' and public.is_admin())
  with check (bucket_id = 'sponsor_logos' and public.is_admin());

-- ── speaker_photos (public read; admin write only) ──
drop policy if exists "speaker_photos_storage_public_select" on storage.objects;
create policy "speaker_photos_storage_public_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'speaker_photos');
drop policy if exists "speaker_photos_storage_admin_all" on storage.objects;
create policy "speaker_photos_storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'speaker_photos' and public.is_admin())
  with check (bucket_id = 'speaker_photos' and public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- DONE. Next step (see README): create your admin user in Supabase Auth,
-- then insert their row into public.admin_profiles.
-- ═══════════════════════════════════════════════════════════════════════
