# MEDSAM Scientific Conference & Symposium — Website & Management Platform

**Theme:** *“Advancing Medical Science through Research, Innovation and Collaboration”*

- **Pre-Conference Workshop:** 7 November 2026 · 8:00 AM–5:00 PM · Amphitheatre (South Wing), Siriba Campus, Maseno University
- **Main Conference:** 12–13 March 2027 · Maseno University Amphitheatre (South Wing) · 300+ delegates expected

A production-ready React + TypeScript + Vite + Tailwind CSS website with a **real** registration system,
abstract submission, poster/innovation uploads, payment-submission records, a secure admin dashboard,
CSV/PDF/ZIP exports, sponsorship & exhibitor applications, donations, announcements, gallery and full SEO —
backed by **Supabase** (PostgreSQL + Auth + Storage) and deployable to **GitHub + Vercel**.

> Delegates do **not** create accounts. Registration is a one-time form; a unique reference
> (`MEDSAM-2027-XXXXXX`) is generated immediately and can be re-looked-up with ref + email.

---

## 1. Project overview

| Area | What it does |
|---|---|
| Public site (19 pages) | Home, About, Conference, Workshop, Programme, Speakers, Abstracts, Registration, Confirmation, Posters & Innovations, Poster/Innovation submission, Sponsors & Exhibitors, **Our Sponsors** (sponsor marketing wall), **Partners** (affiliations + partner logos), **Social Channels**, Donations, Gallery, Contact, Privacy |
| Registration | Real Supabase-backed form: personal info, category, event(s), live fee calculation (early-bird configurable), payment details + proof upload, duplicate protection, email consent |
| Abstracts | No-account submission, PDF upload (validated), unique `MEDSAM-ABS-XXXXXX` IDs, private storage |
| Posters / Innovations | Participant uploads → private → **admin approval** → public gallery |
| Sponsors / Exhibitors | Tier catalogue (Diamond–Bronze), application forms stored in the DB, sponsor wall managed by admin |
| Donations | Voluntary contribution form with optional proof, stored privately |
| Announcements | Admin-published strip on every public page (scheduled start/end) |
| Admin dashboard | `/admin` — Supabase Auth + `admin_profiles` gate; live stats; registrations (confirm payments, CSV/PDF/print); abstracts (review, comment, Oral/Poster, **Download All ZIP**); submissions approval; speakers/programme/gallery/sponsors CRUD; donations + messages; downloads hub; settings (fees, early-bird deadline, socials, contact) |
| Exports | Registrations CSV/PDF, payments CSV, abstracts CSV/ZIP, posters ZIP, innovations ZIP, sponsor/exhibitor/donation/message CSVs |
| Security | Row Level Security on every table, private storage buckets for payment proofs & abstracts, storage policies that expose posters/innovations only when approved, admin-only routes, input validation, file type/size validation |

---

## 2. Technology stack

- **React 18 + TypeScript** (strict)
- **Vite 5** (dev server & production build)
- **Tailwind CSS v4** (`@tailwindcss/vite` plugin, brand palette in `src/index.css`)
- **Supabase** — PostgreSQL, Auth (admin only), Storage (7 buckets)
- **react-router-dom v6** (code-split admin bundle)
- **lucide-react** icons · **jszip** (bulk downloads) · **jspdf + jspdf-autotable** (branded PDF reports)
- Hosted on **Vercel** (SPA rewrite in `vercel.json`) · versioned on **GitHub**

---

## 3. Installation

```bash
git clone <your-repo-url> medsam-conference
cd medsam-conference
npm install
```

Requires **Node 18+** (Node 20+ recommended).

## 4. Running locally

```bash
cp .env.example .env       # then fill in your Supabase values
npm run dev                # http://localhost:5173
```

Without `.env` values the site still runs (public pages render) and shows friendly
“database not connected” notices on data screens — but **all forms require Supabase** to work.

## 5. Environment variables

| Variable | Where to get it | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Public key — safe in the browser; RLS enforces security |

**Never** commit `.env` (already in `.gitignore`). There are no service-role keys in this project — the app is
designed to work from the browser with the anon key + RLS.

## 6. Supabase setup (step by step)

1. Create a project at <https://supabase.com>.
2. Open the **SQL Editor** and paste the entire contents of
   `supabase/migrations/0001_init.sql`, then **Run**.
   This creates all tables, indexes, RLS policies, storage buckets + policies,
   the `get_registration_public` lookup function, and the default site config.
3b. **Optional (Partners page):** if you want the `partners` table + `partner_logos`
   bucket (public *Partners* page + Admin → Partners), also run
   `supabase/migrations/0002_partners.sql`. The site degrades gracefully without it.
3. Verify in the **Table Editor** that these tables exist:
   `config`, `admin_profiles`, `registrations`, `payments`, `abstract_submissions`,
   `poster_submissions`, `innovation_submissions`, `sponsors`, `sponsor_applications`,
   `exhibitor_applications`, `donations`, `speakers`, `programme_items`, `gallery_items`,
   `announcements`, `contact_messages`.
4. Verify in **Storage** that these buckets exist:
   `abstracts` (private), `payment_proofs` (private), `posters`, `innovations`,
   `gallery`, `sponsor_logos`, `speaker_photos` (public).
5. Copy the **Project URL** and **anon key** into your local `.env` and your Vercel env vars.

## 7. Admin account setup

1. Supabase Dashboard → **Authentication → Users → Add user** (choose “Create new user”),
   enter the Secretariat email + a strong password.
2. In the **SQL Editor** run (replace the email with the admin's real email):

   ```sql
   insert into public.admin_profiles (user_id, full_name, role)
   select id, 'MEDSAM Secretariat', 'admin'
   from auth.users
   where lower(email) = 'admin@example.com';
   ```

3. Log in at `https://<your-site>/admin/login`.
   Anyone *without* an `admin_profiles` row is rejected even if they have a Supabase account.

To add more admins: repeat step 2 for each email.

## 8. Storage bucket notes

- `abstracts`, `payment_proofs` are **private** — delegates upload via the anon key (insert policy),
  only admins can read/download (enforced by storage policies + `is_admin()`).
- `posters` and `innovations` are technically public buckets, but the **read policy checks the
  database**: a file is downloadable by the public only if its DB row is `approved`.
- `gallery`, `sponsor_logos`, `speaker_photos` are public but **write-protected to admins**.

## 9. Managing content (admin area)

| Task | Where |
|---|---|
| Confirm payments / confirm registration / cancel | `/admin/registrations` → row → eye icon |
| Review abstracts, add comments, assign Oral/Poster | `/admin/abstracts` |
| Download ALL abstracts as ZIP | `/admin/abstracts` (gold button) or `/admin/downloads` |
| Approve/reject posters & innovations | `/admin/submissions` |
| Add/edit speakers (with photos) | `/admin/speakers` |
| Edit the programme (or insert the tentative placeholder programme) | `/admin/programme` |
| Upload gallery photos / add video links | `/admin/gallery` |
| Manage displayed sponsor logos & applications | `/admin/sponsors` |
| Add partner organisations + upload their logos | `/admin/partners` |
| Verify donations, read contact messages | `/admin/support` |
| Publish announcements (top strip) | `/admin/announcements` |
| Change fees, **early-bird deadline**, workshop fee, social links, contact details | `/admin/settings` |
| Every CSV/PDF/ZIP export in one place | `/admin/downloads` |

## 10. Deployment

### GitHub
```bash
git init && git add -A && git commit -m "MEDSAM conference platform"
git branch -M main
git remote add origin https://github.com/<you>/medsam-conference.git
git push -u origin main
```

### Vercel
1. Push the repo to GitHub.
2. Vercel → **New Project** → import the repo. Framework preset: **Vite** (auto-detected).
3. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy. SPA routing is handled by `vercel.json` (all routes → `index.html`).
5. After first deploy, replace `YOUR-DOMAIN.example.com` in `public/sitemap.xml` and `public/robots.txt`
   with your real domain and redeploy.

## 11. Adding & replacing images

All swappable imagery lives in **`src/assets/images/`**:

```
src/assets/images/
├── README.md            ← placement guide
├── branding/            ← official MEDSAM logo (replace MedsamLogo component or drop PNG here)
├── conference/          ← hero-conference.jpg, main-hall.jpg, innovation-lab.jpg (currently AI-generated placeholders)
├── speakers/            ← (optional local fallbacks; live speaker photos upload via Admin → Speakers)
├── gallery/             ← (live gallery uploads happen in Admin → Gallery, stored in Supabase)
├── sponsors/            ← (live sponsor logos upload via Admin → Sponsors)
└── posters/             ← (participant posters live in Supabase Storage)
```

To replace a conference photo: keep the **same filename** and overwrite it in VS Code — no code changes needed.
Speaker, gallery, sponsor and poster images are database-driven (uploaded through the admin dashboard),
so no VS Code step is required for those.

## 12. Updating social media links

Do it in the admin area: `/admin/settings` → *Social media links*. Empty links are hidden automatically —
no need to invent placeholder accounts.

## 13. Updating conference dates

Dates/venues/contact live in **`src/lib/constants.ts`** (single source of truth for display text + countdowns):
`WORKSHOP.dateIso`, `MAIN_CONFERENCE.startIso`, etc. The early-bird **deadline** is admin-configurable at
`/admin/settings` (stored in the database, not hard-coded).

## 14. Updating registration fees

`/admin/settings` → *Registration fees*: student standard, non-student standard, early-bird student,
optional early-bird non-student (leave empty to not offer it), workshop fee (leave empty until confirmed).
Changes apply site-wide immediately.

## 15. Troubleshooting

| Symptom | Fix |
|---|---|
| “The conference database is not connected yet” | `.env` missing/misnamed. It must be exactly `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. On Vercel, add both as env vars and redeploy. |
| Admin login says invalid credentials | Check the email/password; then confirm the `admin_profiles` row exists (SQL above). |
| Logged in but bounced back to login | Your user has no `admin_profiles` row — run the SQL insert in §7. |
| Form insert fails with `new row violates row-level security` | Re-run `0001_init.sql` (policies were dropped/changed), or confirm RLS is enabled on the table. |
| Public poster image 404s | The item's status isn't `approved`, or the stored path doesn't match the storage object name (re-upload from admin). |
| `npm run build` fails | Run `npx tsc --noEmit` to see the first TypeScript error. |
| Countdown shows “event started” message | Expected — the target date has passed. Update the ISO date in `src/lib/constants.ts`. |
| Preview/deploy shows unstyled page | Ensure you deployed the built app (Vercel) — don't point the domain at the raw `index.html` in `src`. |

---

## 15b. Our Sponsors / Partners / Social pages

- **`/our-sponsors`** — public marketing wall for confirmed sponsors, grouped by tier
  (Diamond → Bronze). Logos are uploaded by the Secretariat in
  **Admin → Sponsors & Exhibitors → Sponsor Wall**.
- **`/partners`** — institutional affiliations (SOMU affiliate, MSAKE member — proposal facts)
  plus partner organisations added in **Admin → Partners** (name, role, logo upload from the
  admin's device, website link).
- **`/social`** — official social channel cards. Links come from **Admin → Settings →
  Social media links**; unconfigured channels show a "Coming soon" badge instead of a fake link.

All three use the same upload-from-device pattern (drag & drop / file picker in the admin
modals) as speaker photos and gallery images.

---

## 16. Content rules honoured in this build

- No invented speakers, sponsors, social accounts or statistics — clearly-marked placeholders until the Secretariat provides real data.
- No internal budget or finance figures anywhere on the public site.
- Payment channels are **exactly** the supplied M-PESA Till `9086003` and KCB account (never more, never auto-verified).
- Contact details are exactly the supplied organising-team email and phones.
