/* Central place for all conference facts shown across the site.
   Edit values here (or in the Admin → Settings screen) when details change. */

export const CONFERENCE = {
  name: 'MEDSAM Scientific Conference & Symposium',
  shortName: 'MEDSAM 2027',
  theme: 'Advancing Medical Science through Research, Innovation and Collaboration',
  themeTagline: 'A limelight into the main event',
  venue: 'Maseno University Amphitheatre — South Wing',
  campus: 'Siriba Campus, Maseno University',
  institution: 'Maseno University School of Medicine',
  attendance: '300+ Delegates',
  year: '2027',
} as const

export const WORKSHOP = {
  name: 'MEDSAM Pre-Conference Workshop',
  dateIso: '2026-11-07T08:00:00+03:00', // 7th November 2026, 8:00 AM (EAT)
  dateLabel: '7th November 2026',
  timeLabel: '8:00 AM to 5:00 PM',
  venue: 'Amphitheatre (South Wing) — Siriba Campus, Maseno University',
} as const

export const MAIN_CONFERENCE = {
  name: 'MEDSAM Main Conference & Symposium',
  startIso: '2027-03-12T08:00:00+03:00', // 12th March 2027, 8:00 AM (EAT)
  endIso: '2027-03-13T17:00:00+03:00',
  dateLabel: '12th – 13th March 2027',
  venue: 'Maseno University Amphitheatre — South Wing',
} as const

export const CONTACT = {
  team: 'MEDSAM Scientific Conference & Symposium Organizing Team',
  email: 'medsamscientifcconferenceorga@gmail.com',
  phones: ['+254 115 705 403', '+254 742 332 660'],
  institution: 'Maseno University School of Medicine',
} as const

export const PAYMENT = {
  mpesaTill: '9086003',
  bankAccountName: 'Maseno University Sch. of Medicine Students Association',
  bankAccountNumber: '1143673336',
  bankName: 'KCB',
  bankBranch: 'Luanda Branch',
  note: 'Registration is subject to payment confirmation by the Secretariat.',
} as const

export const CATEGORIES = [
  'Student',
  'Faculty',
  'Researcher',
  'Lecturer',
  'Clinician',
  'Healthcare Professional',
  'Industry/Corporate',
  'Other',
] as const

/** Categories that count as "student" for fee purposes. */
export const STUDENT_CATEGORIES = ['Student'] as const

export const EVENTS = [
  { id: 'workshop', label: 'Pre-Conference Workshop (7 Nov 2026)' },
  { id: 'conference', label: 'Main Conference (12–13 Mar 2027)' },
  { id: 'both', label: 'Both — Workshop & Main Conference' },
] as const

export const TRACKS = [
  {
    no: '01',
    title: 'Clinical and Translational Sciences',
    description:
      'Bridging the gap between discovery and the clinic — clinical research, diagnostics, therapeutics and evidence from the bedside.',
    icon: 'Stethoscope',
  },
  {
    no: '02',
    title: 'Biomedical and Laboratory Sciences',
    description:
      'Fundamental and laboratory-driven research in pathology, microbiology, biochemistry, genetics and medical sciences.',
    icon: 'FlaskConical',
  },
  {
    no: '03',
    title: 'Health Systems, Policy and Leadership',
    description:
      'The structures, policies and leadership that shape the delivery, governance and quality of health care.',
    icon: 'Landmark',
  },
  {
    no: '04',
    title: 'Public Health and Community Health',
    description:
      'Population health, disease prevention, epidemiology and community-based interventions that strengthen health outcomes.',
    icon: 'Users',
  },
  {
    no: '05',
    title: 'Medical Education and Professional Development',
    description:
      'Innovations in teaching, learning, assessment and the development of future health-care professionals.',
    icon: 'GraduationCap',
  },
  {
    no: '06',
    title: 'Innovation, Technology and Entrepreneurship in Health',
    description:
      'Digital health, medical devices, research tools and health-tech ventures solving real clinical and community problems.',
    icon: 'Cpu',
  },
] as const

export const SPONSOR_TIERS = [
  {
    id: 'diamond',
    name: 'Diamond',
    priceKes: 500000,
    tagline: 'Principal partner of the conference',
    benefits: [
      'Prime placement across all conference branding and signage',
      'Logo on website, delegate materials and social media',
      'Complimentary registrations (as agreed with the Secretariat)',
      'Dedicated speaking or presentation slot',
      'Premium exhibition stand with full utilities',
      'Feature in all pre- and post-conference communications',
      'Post-conference recognition and thank-you certificate',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    priceKes: 300000,
    tagline: 'High-visibility partner',
    benefits: [
      'Prominent placement on conference branding and signage',
      'Logo on website, delegate materials and social media',
      'Complimentary registrations (as agreed with the Secretariat)',
      'Speaking or presentation opportunity',
      'Large exhibition stand',
      'Post-conference recognition and thank-you certificate',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    priceKes: 200000,
    tagline: 'Strong brand presence',
    benefits: [
      'Placement on conference signage and delegate materials',
      'Logo on website and social media promotion',
      'Complimentary registration (as agreed with the Secretariat)',
      'Standard exhibition stand',
      'Post-conference recognition',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    priceKes: 100000,
    tagline: 'Visible participation',
    benefits: [
      'Logo on website and conference signage',
      'Standard exhibition space',
      'Mention in delegate materials',
      'Post-conference recognition',
    ],
  },
  {
    id: 'bronze',
    name: 'Bronze',
    priceKes: 50000,
    tagline: 'Entry-level partnership',
    benefits: [
      'Logo on website sponsor page',
      'Basic exhibition space',
      'Inclusion in delegate materials listing',
      'Post-conference recognition',
    ],
  },
] as const

export const AWARDS = [
  { name: 'Best Oral Presentation', detail: 'Top 3 oral presentations are recognised.' },
  { name: 'Best Poster Presentation', detail: 'Top 3 poster presentations are recognised.' },
  { name: 'Best Innovation / Pitch', detail: 'Top 3 innovations and pitches are recognised.' },
] as const

/** Placeholder programme seeds (clearly marked tentative — admin can edit/delete). */
export const PROGRAMME_PLACEHOLDERS = [
  { day: 'Day 1 — Friday, 12 March 2027', category: 'opening', time: '8:00 AM', title: 'Registration & Delegate Check-in', description: 'Tentative — final programme to be announced.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 1 — Friday, 12 March 2027', category: 'opening', time: '9:00 AM', title: 'Opening Ceremony (Tentative)', description: 'Welcome address, prayers and official opening. Final programme to be announced.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 1 — Friday, 12 March 2027', category: 'keynote', time: '10:00 AM', title: 'Keynote Session (Tentative)', description: 'Invited keynote address. Speaker announcement to follow.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 1 — Friday, 12 March 2027', category: 'oral', time: '11:00 AM', title: 'Oral Presentations (Tentative)', description: 'Accepted oral abstracts across all scientific tracks.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 1 — Friday, 12 March 2027', category: 'panel', time: '2:00 PM', title: 'Panel Discussion (Tentative)', description: 'Evidence-based dialogue on emerging health challenges.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 2 — Saturday, 13 March 2027', category: 'oral', time: '8:30 AM', title: 'Oral Presentations (Tentative)', description: 'Continuation of scientific sessions.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 2 — Saturday, 13 March 2027', category: 'poster', time: '10:00 AM', title: 'Poster Presentations (Tentative)', description: 'Poster exhibition and judging.', location: 'South Wing foyer' },
  { day: 'Day 2 — Saturday, 13 March 2027', category: 'innovation', time: '12:00 PM', title: 'Innovation / Pitch Session (Tentative)', description: 'Showcase of health innovations and startup pitches.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 2 — Saturday, 13 March 2027', category: 'awards', time: '4:00 PM', title: 'Awards Ceremony (Tentative)', description: 'Recognition of best presentations and innovations.', location: 'Amphitheatre, South Wing' },
  { day: 'Day 2 — Saturday, 13 March 2027', category: 'closing', time: '4:30 PM', title: 'Closing Session (Tentative)', description: 'Valedictory address and conference close.', location: 'Amphitheatre, South Wing' },
] as const
