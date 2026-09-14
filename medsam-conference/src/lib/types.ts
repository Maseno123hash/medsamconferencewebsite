/* Row types matching supabase/migrations/0001_init.sql */

export type RegistrationStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'registration_confirmed'
  | 'cancelled'

export type EventSelection = 'workshop' | 'conference' | 'both'

export interface Registration {
  id: string
  ref_code: string
  full_name: string
  email: string
  phone: string
  country: string | null
  institution: string | null
  school_faculty: string | null
  department: string | null
  year_of_study: string | null
  category: string
  event_selection: EventSelection
  tier: 'early_bird' | 'standard'
  amount: number
  status: RegistrationStatus
  communication_consent: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  registration_id: string
  method: string
  amount: number
  transaction_ref: string | null
  paid_on: string | null
  proof_path: string | null
  status: 'submitted' | 'confirmed' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
}

export type AbstractStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'revision_required'
  | 'rejected'
  | 'oral'
  | 'poster'

export interface AbstractSubmission {
  id: string
  submission_id: string
  author_name: string
  email: string
  phone: string | null
  institution: string
  department: string | null
  abstract_title: string
  authors: string | null
  track: string
  presentation_preference: 'oral' | 'poster' | 'either'
  abstract_text: string
  keywords: string | null
  pdf_path: string | null
  status: AbstractStatus
  reviewer_comments: string | null
  created_at: string
  updated_at: string
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface PosterSubmission {
  id: string
  title: string
  description: string | null
  team_members: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  institution: string | null
  track: string | null
  poster_pdf_path: string | null
  poster_image_path: string | null
  status: SubmissionStatus
  created_at: string
  updated_at: string
}

export interface InnovationSubmission {
  id: string
  title: string
  description: string | null
  team_members: string | null
  contact_name: string
  contact_email: string
  contact_phone: string | null
  institution: string | null
  track: string | null
  materials_path: string | null
  image_path: string | null
  status: SubmissionStatus
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: string
  name: string
  title: string | null
  institution: string | null
  biography: string | null
  topic: string | null
  photo_path: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface ProgrammeItem {
  id: string
  day: string
  time: string | null
  title: string
  description: string | null
  category: string
  location: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  title: string | null
  category: string
  media_type: 'image' | 'video'
  file_path: string | null
  video_url: string | null
  caption: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  organization: string
  pkg: string
  logo_path: string | null
  website: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  name: string
  role: string | null
  logo_path: string | null
  website: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type AppStatus = 'pending' | 'contacted' | 'confirmed' | 'declined'

export interface SponsorApplication {
  id: string
  organization: string
  contact_person: string
  email: string
  phone: string | null
  organisation_type: string | null
  preferred_package: string | null
  message: string | null
  status: AppStatus
  created_at: string
  updated_at: string
}

export interface ExhibitorApplication {
  id: string
  organisation: string
  contact_person: string
  email: string
  phone: string | null
  organisation_type: string | null
  products_services: string | null
  exhibition_requirements: string | null
  preferred_package: string | null
  message: string | null
  status: AppStatus
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  name_or_org: string
  email: string | null
  phone: string | null
  amount: number
  payment_method: string | null
  transaction_ref: string | null
  message: string | null
  proof_path: string | null
  status: 'submitted' | 'confirmed' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  type: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

export interface AdminProfile {
  id: string
  user_id: string
  role: string
  full_name: string | null
  created_at: string
}

/* ------- Public site configuration (read from public.config) ------- */
export interface SocialLinks {
  facebook: string
  instagram: string
  x: string
  youtube: string
  linkedin: string
  website: string
}

export interface SiteConfig {
  currency: string
  studentStandard: number
  nonStudentStandard: number
  earlyBirdStudent: number
  earlyBirdNonStudent: number | null // null = not offered to non-students
  earlyBirdDeadline: string | null
  workshopFee: number | null // null = fee to be confirmed by Secretariat
  socials: SocialLinks
  contactEmail: string
  contactPhones: string[]
}

export const DEFAULT_CONFIG: SiteConfig = {
  currency: 'USD',
  studentStandard: 50,
  nonStudentStandard: 90,
  earlyBirdStudent: 40,
  earlyBirdNonStudent: null,
  earlyBirdDeadline: '2026-12-31T23:59:59Z',
  workshopFee: null,
  socials: {
    facebook: '',
    instagram: '',
    x: '',
    youtube: '',
    linkedin: '',
    website: '',
  },
  contactEmail: 'medsamscientifcconferenceorga@gmail.com',
  contactPhones: ['+254 115 705 403', '+254 742 332 660'],
}
