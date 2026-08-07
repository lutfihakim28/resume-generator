import type { EducationEntry, ExperienceEntry, Lang, LangText, LanguageEntry } from '@/types/resume'

/** True when the ID variant of a language-pair field is empty (warn-only, never blocks). */
export function isIncomplete(lt: LangText | undefined | null): boolean {
  return !lt || lt.id.trim() === ''
}

/** Trimmed text of a LangText in the requested language ('' when missing). */
export function pickLang(lt: LangText | undefined | null, lang: Lang): string {
  return lt?.[lang]?.trim() ?? ''
}

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]
const MONTH_YEAR_RE = /^(0[1-9]|1[0-2])\/(\d{4})$/

/**
 * "03/2022" → "Mar 2022" (EN) / "Mar 2022" (ID month names).
 * Non-MM/YYYY input is returned unchanged so a typo never disappears silently.
 */
export function formatMonthYear(value: string, lang: Lang): string {
  const match = MONTH_YEAR_RE.exec(value.trim())
  if (!match) return value.trim()
  const monthIndex = Number(match[1]) - 1
  const months = lang === 'id' ? MONTHS_ID : MONTHS_EN
  return `${months[monthIndex]} ${match[2]}`
}

/** "Present" / "Sekarang" label for a still-current role. */
export function presentLabel(lang: Lang): string {
  return lang === 'id' ? 'Sekarang' : 'Present'
}

/** "Mar 2022 – Present"; empty start → ''. Shared by preview and PDF export. */
export function dateRange(entry: ExperienceEntry, lang: Lang): string {
  const start = entry.start.trim()
  if (start === '') return ''
  const isPresent = entry.end === null || entry.end.trim() === ''
  const end = isPresent ? presentLabel(lang) : formatMonthYear(entry.end!, lang)
  return `${formatMonthYear(start, lang)} – ${end}`
}

/**
 * "Senior Backend Engineer — PT Teknologi Maju, Jakarta".
 * Single-interpolation string (no whitespace traps) — shared by preview and PDF export.
 */
export function roleLine(entry: ExperienceEntry, lang: Lang): string {
  const role = pickLang(entry.role, lang)
  const place = [entry.company.trim(), entry.city.trim()].filter(Boolean).join(', ')
  return [role, place].filter(Boolean).join(' — ')
}

/** "S.Kom., Informatics Engineering — Universitas Indonesia, Depok" (+ GPA). */
export function educationLine(entry: EducationEntry, lang: Lang): string {
  const degree = [pickLang(entry.degree, lang), pickLang(entry.major, lang)]
    .filter(Boolean)
    .join(', ')
  const school = [entry.university.trim(), entry.city.trim()].filter(Boolean).join(', ')
  const core = [degree, school].filter(Boolean).join(' — ')
  return entry.gpa ? `${core} · GPA ${entry.gpa}` : core
}

/** "Bahasa Indonesia (native)"; proficiency alone when the name is blank. */
export function languageLabel(entry: LanguageEntry, lang: Lang): string {
  const name = entry.name.trim()
  const proficiency = pickLang(entry.proficiency, lang)
  if (!name) return proficiency
  return proficiency ? `${name} (${proficiency})` : name
}

/** "Budi Santoso" → "budi-santoso"; blank → ''. ASCII-safe for filenames. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}
