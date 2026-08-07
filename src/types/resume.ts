/**
 * Resume data model for the form section.
 *
 * Nesting rule (oracle decision): free-text prose that differs per language
 * → `LangText { en, id }`; proper nouns / facts (name, company, city, dates,
 * URLs, university, stack tags) → single string, shared by both languages.
 */

export type Lang = 'en' | 'id'

export interface LangText {
  en: string
  id: string
}

export interface PersonalInfo {
  name: string
  title: LangText
  phone: string
  email: string
  city: string
  github: string
  linkedin: string
  portfolio: string
  /** Only rendered when `options.showPhoto` is on (dev preset defaults to no photo). */
  photoUrl: string
}

export interface SkillGroup {
  id: string
  label: LangText
  /** Comma-separated skill list — ATS-safe, no bars/tables. */
  items: LangText
}

export interface ExperienceEntry {
  id: string
  role: LangText
  company: string
  city: string
  /** Format "MM/YYYY". */
  start: string
  /** `null` = still present (renders "Present"/"Sekarang"). */
  end: string | null
  /** 3–5 bullets per role. */
  bullets: LangText[]
  /** Comma-separated stack tags used in this role. */
  stack: string
}

export interface ProjectEntry {
  id: string
  name: string
  url: string
  description: LangText
  stack: string
  impact: LangText
}

export interface EducationEntry {
  id: string
  degree: LangText
  major: LangText
  university: string
  city: string
  year: string
  gpa?: string
}

export interface CertificationEntry {
  id: string
  name: string
  issuer: string
  year: string
}

export interface LanguageEntry {
  id: string
  name: string
  proficiency: LangText
}

export interface ResumeOptions {
  showPhoto: boolean
  educationPosition: 'top' | 'bottom'
}

export interface Resume {
  version: 1
  personal: PersonalInfo
  summary: LangText
  skills: SkillGroup[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  education: EducationEntry[]
  certifications: CertificationEntry[]
  languages: LanguageEntry[]
  options: ResumeOptions
}

export const MAX_SKILL_GROUPS = 4
export const MAX_BULLETS_PER_ROLE = 5

let uidCounter = 0

/** `crypto.randomUUID()` with a counter fallback (jsdom / non-secure contexts). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  uidCounter += 1
  return `id-${Date.now().toString(36)}-${uidCounter}`
}

export function createLangText(): LangText {
  return { en: '', id: '' }
}

export function createEmptyResume(): Resume {
  return {
    version: 1,
    personal: {
      name: '',
      title: createLangText(),
      phone: '',
      email: '',
      city: '',
      github: '',
      linkedin: '',
      portfolio: '',
      photoUrl: '',
    },
    summary: createLangText(),
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
    options: { showPhoto: false, educationPosition: 'bottom' },
  }
}

// ---------------------------------------------------------------------------
// Import sanitizers (lenient): keep the base value when a key is missing,
// coerce wrong types to safe defaults, DROP unknown keys on purpose so a
// resume.json from a future schema version cannot leave stale UI state.
// ---------------------------------------------------------------------------

function keepStr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function sanitizeLangText(value: unknown, fallback: LangText): LangText {
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return { en: keepStr(o.en, fallback.en), id: keepStr(o.id, fallback.id) }
  }
  return { ...fallback }
}

function sanitizeLangTextOrEmpty(value: unknown): LangText {
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    return { en: keepStr(o.en, ''), id: keepStr(o.id, '') }
  }
  return createLangText()
}

function sanitizeLangTextArray(value: unknown): LangText[] {
  if (!Array.isArray(value)) return []
  const out: LangText[] = []
  for (const item of value) {
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      out.push({ en: keepStr(o.en, ''), id: keepStr(o.id, '') })
    }
  }
  return out
}

function sanitizeSkillGroup(value: unknown): SkillGroup | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  return {
    id: keepStr(o.id, uid()),
    label: sanitizeLangTextOrEmpty(o.label),
    items: sanitizeLangTextOrEmpty(o.items),
  }
}

function sanitizeExperienceEntry(value: unknown): ExperienceEntry | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  return {
    id: keepStr(o.id, uid()),
    role: sanitizeLangTextOrEmpty(o.role),
    company: keepStr(o.company, ''),
    city: keepStr(o.city, ''),
    start: keepStr(o.start, ''),
    end: typeof o.end === 'string' || o.end === null ? o.end : null,
    bullets: sanitizeLangTextArray(o.bullets),
    stack: keepStr(o.stack, ''),
  }
}

function sanitizeProjectEntry(value: unknown): ProjectEntry | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  return {
    id: keepStr(o.id, uid()),
    name: keepStr(o.name, ''),
    url: keepStr(o.url, ''),
    description: sanitizeLangTextOrEmpty(o.description),
    stack: keepStr(o.stack, ''),
    impact: sanitizeLangTextOrEmpty(o.impact),
  }
}

function sanitizeEducationEntry(value: unknown): EducationEntry | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  const next: EducationEntry = {
    id: keepStr(o.id, uid()),
    degree: sanitizeLangTextOrEmpty(o.degree),
    major: sanitizeLangTextOrEmpty(o.major),
    university: keepStr(o.university, ''),
    city: keepStr(o.city, ''),
    year: keepStr(o.year, ''),
  }
  if (typeof o.gpa === 'string') next.gpa = o.gpa
  return next
}

function sanitizeCertificationEntry(value: unknown): CertificationEntry | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  return {
    id: keepStr(o.id, uid()),
    name: keepStr(o.name, ''),
    issuer: keepStr(o.issuer, ''),
    year: keepStr(o.year, ''),
  }
}

function sanitizeLanguageEntry(value: unknown): LanguageEntry | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  return {
    id: keepStr(o.id, uid()),
    name: keepStr(o.name, ''),
    proficiency: sanitizeLangTextOrEmpty(o.proficiency),
  }
}

function sanitizeList<T>(value: unknown, sanitize: (v: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return []
  const out: T[] = []
  for (const item of value) {
    const sanitized = sanitize(item)
    if (sanitized) out.push(sanitized)
  }
  return out
}

/**
 * Deep-merge an imported resume.json into the current resume.
 * Known keys are sanitized and overlaid; missing keys fall back to `base`;
 * unknown keys are intentionally dropped.
 */
export function mergeResume(base: Resume, raw: unknown): Resume {
  // Deep-clone `base` (structuredClone, with a guarded JSON fallback for old
  // runtimes) — `next` is mutated below and later Object.assign'ed into state.
  let next: Resume
  try {
    next = structuredClone(base)
  } catch {
    next = JSON.parse(JSON.stringify(base)) as Resume
  }
  if (!raw || typeof raw !== 'object') return next
  const r = raw as Record<string, unknown>

  if (r.personal && typeof r.personal === 'object') {
    const p = r.personal as Record<string, unknown>
    next.personal = {
      name: keepStr(p.name, next.personal.name),
      title: sanitizeLangText(p.title, next.personal.title),
      phone: keepStr(p.phone, next.personal.phone),
      email: keepStr(p.email, next.personal.email),
      city: keepStr(p.city, next.personal.city),
      github: keepStr(p.github, next.personal.github),
      linkedin: keepStr(p.linkedin, next.personal.linkedin),
      portfolio: keepStr(p.portfolio, next.personal.portfolio),
      photoUrl: keepStr(p.photoUrl, next.personal.photoUrl),
    }
  }

  next.summary = sanitizeLangText(r.summary, next.summary)
  next.skills = sanitizeList(r.skills, sanitizeSkillGroup)
  next.experience = sanitizeList(r.experience, sanitizeExperienceEntry)
  next.projects = sanitizeList(r.projects, sanitizeProjectEntry)
  next.education = sanitizeList(r.education, sanitizeEducationEntry)
  next.certifications = sanitizeList(r.certifications, sanitizeCertificationEntry)
  next.languages = sanitizeList(r.languages, sanitizeLanguageEntry)

  if (r.options && typeof r.options === 'object') {
    const o = r.options as Record<string, unknown>
    next.options = {
      showPhoto: typeof o.showPhoto === 'boolean' ? o.showPhoto : next.options.showPhoto,
      educationPosition: o.educationPosition === 'top' ? 'top' : 'bottom',
    }
  }

  return next
}

/** Structural validation for an imported resume.json. */
export function isValidResumeJson(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const r = raw as Record<string, unknown>
  if (r.version !== 1) return false
  if (!r.personal || typeof r.personal !== 'object') return false
  const p = r.personal as Record<string, unknown>
  if (typeof p.name !== 'string') return false
  return (
    Array.isArray(r.skills) &&
    Array.isArray(r.experience) &&
    Array.isArray(r.projects) &&
    Array.isArray(r.education) &&
    Array.isArray(r.certifications) &&
    Array.isArray(r.languages)
  )
}
