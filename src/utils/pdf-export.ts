/**
 * PDF export via jsPDF (text-only API) per the oracle plan (Part 6):
 * - Text-preserving/ATS-safe: draws real text, NEVER `doc.html()` (that path
 *   rasterizes via html2canvas and violates the template's §5 no-text-in-image
 *   rule) and NEVER `doc.save()` (harder to test — callers get a Uint8Array).
 * - Deterministic A4 layout mapping template §3: 210×297 mm page, 14 mm
 *   margins, Helvetica (PDF standard-14, WinAnsi — no font embedding).
 * - Atomic entries: an experience/project/education entry never splits across
 *   pages; hard 2-page cap sets `truncated`.
 * - Photo rendering is DEFERRED (cross-origin fetch/CORS taint complexity;
 *   the no-photo preset has no placeholder hole) — v1 PDF is text-only.
 * - Charset limitation: WinAnsi covers EN + ID Latin (incl. `· – —`); CJK/
 *   emoji would render as garbage — accepted, the template is EN/ID only.
 */
import { jsPDF } from 'jspdf'
import { FORM_SECTIONS } from '@/components/resume-form/sections'
import type { ExperienceEntry, Lang, ProjectEntry, Resume, SkillGroup } from '@/types/resume'
import { dateRange, educationLine, languageLabel, pickLang, roleLine } from '@/utils/resume-utils'

export interface PdfExportResult {
  /** Raw PDF bytes — caller wraps in a Blob and downloads. */
  data: Uint8Array<ArrayBuffer>
  pages: number
  /** True when content exceeded 2 pages and drawing stopped. */
  truncated: boolean
}

// ---------------------------------------------------------------------------
// Geometry — A4 in pt, 14 mm margins (template §3.1)
// ---------------------------------------------------------------------------

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 39.7 // 14 mm
const X0 = MARGIN
const CONTENT_W = PAGE_W - MARGIN * 2
const Y0 = MARGIN
const PAGE_BOTTOM = PAGE_H - MARGIN

// Colors (template §3.2) as [r, g, b] triples for jsPDF.
const PRIMARY: [number, number, number] = [31, 36, 48]
const SECONDARY: [number, number, number] = [74, 85, 104]
const ACCENT: [number, number, number] = [30, 90, 168]

// Typography (template §3.4). Line heights are manual advances: body 10.5 × 1.35.
const NAME_SIZE = 19
const NAME_LH = 23
const TITLE_SIZE = 11.5
const TITLE_LH = 14
const SMALL_SIZE = 10
const SMALL_LH = 13
const HEADING_SIZE = 12
const BODY_SIZE = 10.5
const BODY_LH = 14.2
const META_SIZE = 9.5
const META_LH = 12.4
const SECTION_GAP = 10
const ENTRY_GAP = 6
const BULLET_INDENT = 12

const HEADINGS = new Map<string, { en: string; id: string }>()
for (const section of FORM_SECTIONS) {
  HEADINGS.set(section.key, { en: section.headingEn, id: section.headingId })
}

export function buildPdf(resume: Resume, lang: Lang): PdfExportResult {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const name = resume.personal.name.trim()
  doc.setProperties({
    title: name || 'Resume',
    author: name || 'resume-editor',
    creator: 'resume-editor',
  })

  let y = Y0
  let truncated = false
  let firstSection = true

  /** Ensure `blockH` fits; page-break, enforcing the 2-page cap. Returns false → stop. */
  function ensureSpace(blockH: number): boolean {
    if (y + blockH <= PAGE_BOTTOM) return true
    if (doc.getNumberOfPages() >= 2) {
      truncated = true
      return false
    }
    doc.addPage()
    y = Y0
    return true
  }

  function wrap(text: string, fontSize: number, maxWidth = CONTENT_W): string[] {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(fontSize)
    const out = doc.splitTextToSize(text, maxWidth)
    return Array.isArray(out) ? (out as string[]) : [out]
  }

  function drawLines(lines: string[], lineHeight: number): void {
    for (const line of lines) {
      doc.text(line, X0, y)
      y += lineHeight
    }
  }

  function drawHeader(): void {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(NAME_SIZE)
    doc.setTextColor(...PRIMARY)
    if (name) {
      doc.text(name, X0, y)
      y += NAME_LH
    }

    const title = pickLang(resume.personal.title, lang)
    if (title) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(TITLE_SIZE)
      doc.setTextColor(...ACCENT)
      doc.text(title, X0, y)
      y += TITLE_LH
    }

    const contact = [resume.personal.phone, resume.personal.email, resume.personal.city]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' · ')
    const links = [resume.personal.github, resume.personal.linkedin, resume.personal.portfolio]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' · ')
    for (const line of [contact, links]) {
      if (line) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(SMALL_SIZE)
        doc.setTextColor(...SECONDARY)
        doc.text(line, X0, y)
        y += SMALL_LH
      }
    }
  }

  /** Heading + accent rule + 4 pt gap; `firstBlockH` keeps heading+first line together. */
  function beginSection(key: string, firstBlockH: number): boolean {
    const gap = firstSection ? 0 : SECTION_GAP
    firstSection = false
    const pair = HEADINGS.get(key)
    const heading = lang === 'id' ? (pair?.id ?? '') : (pair?.en ?? '')
    if (!ensureSpace(gap + 6.5 + firstBlockH)) return false
    y += gap
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(HEADING_SIZE)
    doc.setTextColor(...PRIMARY)
    doc.text(heading, X0, y)
    const ruleY = y + 2
    doc.setDrawColor(...ACCENT)
    doc.setLineWidth(0.6)
    doc.line(X0, ruleY, X0 + CONTENT_W, ruleY)
    y = ruleY + 4
    return true
  }

  function drawSummary(): boolean {
    const text = pickLang(resume.summary, lang)
    if (!text) return true
    const lines = wrap(text, BODY_SIZE)
    if (!beginSection('summary', lines.length * BODY_LH)) return false
    drawLines(lines, BODY_LH)
    return true
  }

  function drawSkills(): boolean {
    const groups = resume.skills.filter(
      (group) => pickLang(group.label, lang) !== '' || pickLang(group.items, lang) !== '',
    )
    if (groups.length === 0) return true
    if (!beginSection('skills', BODY_LH)) return false
    for (const group of groups) {
      if (!drawSkillGroup(group)) return false
    }
    return true
  }

  /** Label bold + items normal, two-segment draw; wrapped items indent under the label. */
  function drawSkillGroup(group: SkillGroup): boolean {
    const label = pickLang(group.label, lang)
    const items = pickLang(group.items, lang)
    if (!label && !items) return true
    const labelText = label ? `${label}:` : ''
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(BODY_SIZE)
    const labelWidth = labelText ? doc.getTextWidth(labelText) : 0
    const itemLines = items ? wrap(items, BODY_SIZE, CONTENT_W - labelWidth - 2) : []
    const totalH = Math.max(1, itemLines.length) * BODY_LH
    if (!ensureSpace(totalH)) return false

    if (labelText) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PRIMARY)
      doc.text(labelText, X0, y)
    }
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PRIMARY)
    if (itemLines.length > 0) {
      doc.text(itemLines[0]!, X0 + labelWidth + 2, y)
    }
    y += BODY_LH
    for (let i = 1; i < itemLines.length; i++) {
      doc.text(itemLines[i]!, X0 + labelWidth + 2, y)
      y += BODY_LH
    }
    return true
  }

  /** Pre-compute wrapped bullet lines for an entry (font set → then draw). */
  function bulletLines(entry: ExperienceEntry): string[] {
    const out: string[] = []
    for (const bullet of entry.bullets) {
      const text = pickLang(bullet, lang)
      if (!text) continue
      out.push(...wrap(text, BODY_SIZE, CONTENT_W - BULLET_INDENT))
    }
    return out
  }

  function drawExperience(): boolean {
    const entries = resume.experience.filter(entryVisible)
    if (entries.length === 0) return true
    if (!beginSection('experience', entryHeight(entries[0]!))) return false
    for (const entry of entries) {
      const lines = bulletLines(entry)
      const blockH =
        BODY_LH + lines.length * BODY_LH + (entry.stack.trim() ? META_LH : 0) + ENTRY_GAP
      if (!ensureSpace(blockH)) return false

      // Role (bold) + right-aligned dates on the same baseline.
      const role = roleLine(entry, lang)
      const dates = dateRange(entry, lang)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(...PRIMARY)
      doc.text(role, X0, y)
      if (dates) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(META_SIZE)
        doc.setTextColor(...SECONDARY)
        const width = doc.getTextWidth(dates)
        doc.text(dates, X0 + CONTENT_W - width, y)
      }
      y += BODY_LH

      for (const line of lines) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(BODY_SIZE)
        doc.setTextColor(...PRIMARY)
        doc.text('•', X0, y)
        doc.text(line, X0 + BULLET_INDENT, y)
        y += BODY_LH
      }

      if (entry.stack.trim()) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(META_SIZE)
        doc.setTextColor(...SECONDARY)
        doc.text(`Stack: ${entry.stack}`, X0, y)
        y += META_LH
      }
      y += ENTRY_GAP
    }
    return true
  }

  function drawProjects(): boolean {
    const projects = resume.projects.filter(
      (p) => p.name.trim() !== '' || pickLang(p.description, lang) !== '',
    )
    if (projects.length === 0) return true
    if (!beginSection('projects', projectHeight(projects[0]!))) return false
    for (const project of projects) {
      if (!ensureSpace(projectHeight(project))) return false
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(...PRIMARY)
      const display = project.name.trim() || project.url.trim()
      if (project.url.trim()) {
        try {
          doc.textWithLink(display, X0, y, { url: project.url })
        } catch {
          doc.text(display, X0, y) // link failure degrades to plain text
        }
      } else {
        doc.text(display, X0, y)
      }
      y += BODY_LH

      for (const text of [pickLang(project.description, lang), pickLang(project.impact, lang)]) {
        if (!text) continue
        const lines = wrap(text, BODY_SIZE)
        if (!ensureSpace(lines.length * BODY_LH)) return false
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...PRIMARY)
        for (const line of lines) {
          doc.text(line, X0, y)
          y += BODY_LH
        }
      }
      if (project.stack.trim()) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(META_SIZE)
        doc.setTextColor(...SECONDARY)
        doc.text(`Stack: ${project.stack}`, X0, y)
        y += META_LH
      }
      y += ENTRY_GAP
    }
    return true
  }

  function drawEducation(): boolean {
    const entries = resume.education.filter(
      (e) => pickLang(e.degree, lang) !== '' || e.university.trim() !== '',
    )
    if (entries.length === 0) return true
    if (!beginSection('education', BODY_LH)) return false
    for (const entry of entries) {
      if (!ensureSpace(BODY_LH)) return false
      const line = educationLine(entry, lang)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(...PRIMARY)
      doc.text(line, X0, y)
      if (entry.year.trim()) {
        doc.setFontSize(META_SIZE)
        doc.setTextColor(...SECONDARY)
        const width = doc.getTextWidth(entry.year)
        doc.text(entry.year, X0 + CONTENT_W - width, y)
      }
      y += BODY_LH
    }
    return true
  }

  function drawCertifications(): boolean {
    const certs = resume.certifications.filter((c) => c.name.trim() !== '')
    if (certs.length === 0) return true
    if (!beginSection('certifications', BODY_LH)) return false
    for (const cert of certs) {
      const suffix = [cert.issuer.trim(), cert.year.trim()].filter(Boolean).join(' | ')
      const line = suffix ? `${cert.name} — ${suffix}` : cert.name
      const lines = wrap(line, BODY_SIZE)
      if (!ensureSpace(lines.length * BODY_LH)) return false
      drawLines(lines, BODY_LH)
    }
    return true
  }

  function drawLanguages(): boolean {
    const entries = resume.languages.filter((l) => l.name.trim() !== '')
    if (entries.length === 0) return true
    const line = entries.map((l) => languageLabel(l, lang)).join(' · ')
    const lines = wrap(line, BODY_SIZE)
    if (!beginSection('languages', lines.length * BODY_LH)) return false
    drawLines(lines, BODY_LH)
    return true
  }

  function entryVisible(entry: ExperienceEntry): boolean {
    return (
      pickLang(entry.role, lang) !== '' ||
      entry.company.trim() !== '' ||
      entry.start.trim() !== '' ||
      entry.stack.trim() !== '' ||
      entry.bullets.some((b) => pickLang(b, lang) !== '')
    )
  }

  function entryHeight(entry: ExperienceEntry): number {
    const lines = bulletLines(entry)
    return BODY_LH + lines.length * BODY_LH + (entry.stack.trim() ? META_LH : 0) + ENTRY_GAP
  }

  function projectHeight(project: ProjectEntry): number {
    let h = BODY_LH
    if (pickLang(project.description, lang)) h += BODY_LH
    if (pickLang(project.impact, lang)) h += BODY_LH
    if (project.stack.trim()) h += META_LH
    return h + ENTRY_GAP
  }

  // -------------------------------------------------------------------------
  // Render pipeline (template §3.3 order; education position honors the option)
  // -------------------------------------------------------------------------

  drawHeader()
  y += SECTION_GAP

  if (resume.options.educationPosition === 'top') {
    if (!drawEducation()) return finish()
  }
  if (!drawSummary()) return finish()
  if (!drawSkills()) return finish()
  if (!drawExperience()) return finish()
  if (!drawProjects()) return finish()
  if (resume.options.educationPosition !== 'top') {
    if (!drawEducation()) return finish()
  }
  if (!drawCertifications()) return finish()
  if (!drawLanguages()) return finish()

  return finish()

  function finish(): PdfExportResult {
    return {
      data: new Uint8Array(doc.output('arraybuffer')),
      pages: doc.getNumberOfPages(),
      truncated,
    }
  }
}
