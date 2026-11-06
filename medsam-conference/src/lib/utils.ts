import type { SiteConfig } from './types'
import { DEFAULT_CONFIG } from './types'

/** Tiny className combiner. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatMoney(amount: number, currency = 'USD'): string {
  return `${currency} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`
}

export function formatDate(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

/** Loose phone validation: 8–15 digits, allows +, spaces, dashes. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s\-()]/g, '')
  return /^\+?\d{8,15}$/.test(digits)
}

/** Remove characters unsafe in filenames. */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120)
}

/** Generate a human-friendly unique reference, e.g. MEDSAM-2027-9F3K2A. */
export function generateRef(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `${prefix}-${code}`
}

export interface FileValidation {
  accept: string[] // e.g. ['.pdf'] or ['.jpg', '.png']
  maxSizeMB: number
}

export function validateFile(file: File, rules: FileValidation): string | null {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
  if (!rules.accept.includes(ext)) {
    return `File type not allowed. Accepted: ${rules.accept.join(', ')}`
  }
  if (file.size > rules.maxSizeMB * 1024 * 1024) {
    return `File is too large. Maximum size is ${rules.maxSizeMB} MB.`
  }
  if (file.size === 0) return 'File is empty.'
  return null
}

export const IMAGE_TYPES: FileValidation = { accept: ['.jpg', '.jpeg', '.png', '.webp'], maxSizeMB: 5 }
export const PDF_TYPES: FileValidation = { accept: ['.pdf'], maxSizeMB: 5 }
export const PROOF_TYPES: FileValidation = { accept: ['.pdf', '.jpg', '.jpeg', '.png'], maxSizeMB: 5 }

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadTextFile(filename: string, content: string, mime = 'text/plain'): void {
  downloadBlob(new Blob([content], { type: `${mime};charset=utf-8` }), filename)
}

/** Merge stored config JSONB with safe defaults. */
/** Merge stored config JSONB with safe defaults. */
export function parseConfig(raw: unknown): SiteConfig {
  const base: SiteConfig = {
    ...DEFAULT_CONFIG,
    socials: { ...DEFAULT_CONFIG.socials },
    contactPhones: [...DEFAULT_CONFIG.contactPhones],
    workshop: { ...DEFAULT_CONFIG.workshop },
    conference: { ...DEFAULT_CONFIG.conference },
  }

  if (!raw || typeof raw !== 'object') return base

  const r = raw as Record<string, unknown>

  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback

  const numOrNull = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? v : null

  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' ? v : fallback

  const parseEvent = (
    value: unknown,
    fallback: SiteConfig['workshop'],
  ): SiteConfig['workshop'] => {
    const event =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {}

    const status = event.status

    return {
      title: str(event.title, fallback.title),
      theme: str(event.theme, fallback.theme),
      startAt: str(event.startAt, fallback.startAt),
      endAt: str(event.endAt, fallback.endAt),
      venue: str(event.venue, fallback.venue),
      registrationOpensAt: str(
        event.registrationOpensAt,
        fallback.registrationOpensAt,
      ),
      registrationClosesAt: str(
        event.registrationClosesAt,
        fallback.registrationClosesAt,
      ),
      status:
        status === 'scheduled' ||
        status === 'postponed' ||
        status === 'completed'
          ? status
          : fallback.status,
    }
  }

  const socials =
    r.socials && typeof r.socials === 'object'
      ? (r.socials as Record<string, unknown>)
      : {}

  return {
    currency: str(r.currency, base.currency),
    abstractFee: numOrNull(r.abstractFee),
    abstractFeeCurrency: str(r.abstractFeeCurrency, base.abstractFeeCurrency),
    abstractSubmissionDeadline:
      typeof r.abstractSubmissionDeadline === 'string'
        ? r.abstractSubmissionDeadline
        : base.abstractSubmissionDeadline,
    studentStandard: num(r.studentStandard, base.studentStandard),
    nonStudentStandard: num(r.nonStudentStandard, base.nonStudentStandard),
    earlyBirdStudent: num(r.earlyBirdStudent, base.earlyBirdStudent),
    earlyBirdNonStudent: numOrNull(r.earlyBirdNonStudent),
    earlyBirdDeadline:
      typeof r.earlyBirdDeadline === 'string'
        ? r.earlyBirdDeadline
        : base.earlyBirdDeadline,
    workshopFee: numOrNull(r.workshopFee),

    socials: {
      facebook: str(socials.facebook, base.socials.facebook),
      instagram: str(socials.instagram, base.socials.instagram),
      x: str(socials.x, base.socials.x),
      youtube: str(socials.youtube, base.socials.youtube),
      linkedin: str(socials.linkedin, base.socials.linkedin),
      website: str(socials.website, base.socials.website),
    },
    organisationName: str(r.organisationName, base.organisationName),
    teamName: str(r.teamName, base.teamName),
    institutionName: str(r.institutionName, base.institutionName),
    campus: str(r.campus, base.campus),

    contactEmail: str(r.contactEmail, base.contactEmail),
        contactPhones: Array.isArray(r.contactPhones)
      ? r.contactPhones.filter(
          (phone): phone is string => typeof phone === 'string',
        )
      : base.contactPhones,
    workshop: parseEvent(r.workshop, base.workshop),
    conference: parseEvent(r.conference, base.conference),
  }
}