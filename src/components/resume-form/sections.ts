import type { LangText, Resume } from '@/types/resume'
import { isIncomplete } from '@/utils/resume-utils'

export interface FormSection {
  /** Anchor id used by the nav + `useScrollspy`. */
  id: string
  key: string
  headingEn: string
  headingId: string
}

/** Section order follows docs/research/software-developer-template.md §3.3. */
export const FORM_SECTIONS: FormSection[] = [
  { id: 'section-personal', key: 'personal', headingEn: 'Personal', headingId: 'Data Pribadi' },
  {
    id: 'section-summary',
    key: 'summary',
    headingEn: 'Professional Summary',
    headingId: 'Ringkasan Profil',
  },
  { id: 'section-skills', key: 'skills', headingEn: 'Core Skills', headingId: 'Keahlian Inti' },
  {
    id: 'section-experience',
    key: 'experience',
    headingEn: 'Work Experience',
    headingId: 'Pengalaman Kerja',
  },
  { id: 'section-projects', key: 'projects', headingEn: 'Projects', headingId: 'Proyek' },
  { id: 'section-education', key: 'education', headingEn: 'Education', headingId: 'Pendidikan' },
  {
    id: 'section-certifications',
    key: 'certifications',
    headingEn: 'Certifications',
    headingId: 'Sertifikasi',
  },
  { id: 'section-languages', key: 'languages', headingEn: 'Languages', headingId: 'Bahasa' },
  { id: 'section-options', key: 'options', headingEn: 'Options', headingId: 'Opsi' },
]

/** Per-section LangText fields — drives the "ID incomplete" dots. */
export const SECTION_FIELDS: Record<string, (resume: Resume) => LangText[]> = {
  personal: (r) => [r.personal.title],
  summary: (r) => [r.summary],
  skills: (r) => r.skills.flatMap((g) => [g.label, g.items]),
  experience: (r) => r.experience.flatMap((e) => [e.role, ...e.bullets]),
  projects: (r) => r.projects.flatMap((p) => [p.description, p.impact]),
  education: (r) => r.education.flatMap((e) => [e.degree, e.major]),
  certifications: () => [],
  languages: (r) => r.languages.flatMap((l) => [l.proficiency]),
  options: () => [],
}

export function sectionIncompleteFields(resume: Resume, key: string): LangText[] {
  const fields = SECTION_FIELDS[key]?.(resume) ?? []
  return fields.filter((field) => isIncomplete(field))
}

export function sectionIncompleteCount(resume: Resume, key: string): number {
  return sectionIncompleteFields(resume, key).length
}

/** Total empty ID fields across all sections (top alert). */
export function totalIncompleteCount(resume: Resume): number {
  return FORM_SECTIONS.reduce(
    (sum, section) => sum + sectionIncompleteCount(resume, section.key),
    0,
  )
}

export function sectionHeading(section: FormSection, lang: 'en' | 'id'): string {
  return lang === 'en' ? section.headingEn : section.headingId
}
