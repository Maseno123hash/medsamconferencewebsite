# Images — placement guide

Replace the placeholder images with official MEDSAM photos **by overwriting the same filenames**
(no code changes needed), or point existing imports at new files.

```
images/
├── branding/
│   └── (drop the official MEDSAM logo here, e.g. medsam-logo.png)
│       → then swap the <MedsamLogo> component in src/components/ui/MedsamLogo.tsx
│         for an <img src={logo} ...> in Header & Footer.
├── conference/
│   ├── hero-conference.jpg   ← Home hero background (currently AI-generated placeholder)
│   ├── main-hall.jpg         ← Home/Conference/Workshop section image
│   └── innovation-lab.jpg    ← About page image
├── speakers/                 ← optional local fallbacks; live speaker photos are
│                               uploaded via Admin → Speakers (stored in Supabase)
├── gallery/                  ← live gallery media is uploaded via Admin → Gallery
├── sponsors/                 ← live sponsor logos are uploaded via Admin → Sponsors
└── posters/                  ← participant posters live in Supabase Storage (posters/innovations buckets)
```

Tips:
- Keep photos under ~300 KB (resize/compress before committing) — e.g. `squoosh.app`.
- JPG for photos, PNG for logos with transparency.
- Missing files do NOT break the build: every image is imported explicitly, and
  DB-driven images (speakers/gallery/sponsors/posters) fall back to branded placeholders
  when the row has no photo.
