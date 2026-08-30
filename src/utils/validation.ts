import type { ExperienceEntry, Lang, Resume } from '@/types/resume'

export interface ResumeFieldErrors {
  /** `name` is the only hard-required field (oracle decision 5). */
  name?: string
}

export interface DateWarning {
  entryId: string
  message: string
}

export interface ResumeWarnings {
  /** Filled but malformed email. */
  email?: string
  /** No phone AND no email at all. */
  noContact?: string
  /** Malformed or inverted MM/YYYY ranges, per experience entry. */
  dates: DateWarning[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\/\d{4}$/

function monthYearToNumber(value: string): number | null {
  if (!MONTH_YEAR_RE.test(value)) return null
  const [month, year] = value.split('/')
  return Number(year) * 12 + Number(month)
}

/** Hand-rolled, dependency-free validation. Hard error: name. Everything else is a soft warning. */
export function validateResume(resume: Resume, lang: Lang = 'en'): {
  errors: ResumeFieldErrors
  warnings: ResumeWarnings
} {
  const isId = lang === 'id'
  const errors: ResumeFieldErrors = {}
  if (resume.personal.name.trim() === '') {
    errors.name = isId ? 'Nama wajib diisi' : 'Name is required'
  }

  const warnings: ResumeWarnings = { dates: [] }
  const email = resume.personal.email.trim()
  if (email !== '' && !EMAIL_RE.test(email)) {
    warnings.email = isId ? 'Format email tidak valid' : 'Email format looks invalid'
  }
  if (email === '' && resume.personal.phone.trim() === '') {
    warnings.noContact = isId
      ? 'Tambahkan telepon atau email agar perekrut bisa menghubungi Anda.'
      : 'Add a phone or an email so recruiters can reach you.'
  }

  for (const entry of resume.experience) {
    warnings.dates.push(...validateExperienceDates(entry, lang))
  }

  return { errors, warnings }
}

export function validateExperienceDates(entry: ExperienceEntry, lang: Lang = 'en'): DateWarning[] {
  const isId = lang === 'id'
  const out: DateWarning[] = []
  const label = entry.company.trim() || entry.role.en.trim() || 'Experience entry'
  if (entry.start !== '' && !MONTH_YEAR_RE.test(entry.start)) {
    out.push({
      entryId: entry.id,
      message: isId ? `${label}: tanggal mulai harus MM/YYYY` : `${label}: start date should be MM/YYYY`,
    })
  }
  if (entry.end !== null && entry.end !== '' && !MONTH_YEAR_RE.test(entry.end)) {
    out.push({
      entryId: entry.id,
      message: isId ? `${label}: tanggal selesai harus MM/YYYY` : `${label}: end date should be MM/YYYY`,
    })
  }
  const startNum = monthYearToNumber(entry.start)
  const endNum = entry.end ? monthYearToNumber(entry.end) : null
  if (startNum !== null && endNum !== null && endNum < startNum) {
    out.push({
      entryId: entry.id,
      message: isId ? `${label}: tanggal selesai sebelum tanggal mulai` : `${label}: end date is before start date`,
    })
  }
  return out
}
