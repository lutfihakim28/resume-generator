// @vitest-environment node
/**
 * PDF export tests — run in Node (jsPDF's text-only API needs no canvas).
 * Text extraction uses the REAL pdfjs-dist legacy build on the generated
 * bytes, which proves the PDF contains selectable/ATS-safe text (template §5).
 */
import { describe, expect, it } from 'vitest'

import { buildPdf } from '@/utils/pdf-export'
import { createEmptyResume } from '@/types/resume'
import type { Resume } from '@/types/resume'

/** Fill a typical mid-level developer resume (dev-hybrid-id-no-photo sample). */
function fillResume(resume: Resume): void {
  resume.personal.name = 'Budi Santoso'
  resume.personal.title.en = 'Backend Software Engineer · Node.js · TypeScript'
  resume.personal.title.id = 'Backend Software Engineer · Node.js · TypeScript'
  resume.personal.phone = '+62 812-XXXX-XXXX'
  resume.personal.email = 'budi.santoso@email.com'
  resume.personal.city = 'Jakarta, Indonesia'
  resume.personal.github = 'github.com/budisantoso'
  resume.summary.en =
    'Software developer with experience building web and mobile applications since 2020. ' +
    'Started as a frontend developer working with Vue.js, then expanded into mobile development ' +
    'using Capacitor and Flutter. Alongside professional roles, I have taken freelance work as a ' +
    'full-stack developer with Next.js, frontend with Vue.js, and backend with Laravel and Node.js. ' +
    'Most confident building web applications with Vue.js, while staying open to developing ' +
    'multi-platform apps based on my skills.'
  resume.summary.id =
    'Software developer dengan pengalaman membangun aplikasi web dan mobile sejak 2020. ' +
    'Memulai karier sebagai frontend developer dengan Vue.js, kemudian berkembang ke pengembangan ' +
    'aplikasi mobile menggunakan Capacitor dan Flutter. Di sela pekerjaan profesional, saya menerima ' +
    'pekerjaan freelance sebagai fullstack developer dengan Next.js, frontend dengan Vue.js, serta ' +
    'backend dengan Laravel dan Node.js. Paling percaya diri membangun aplikasi web dengan Vue.js, ' +
    'namun tetap terbuka mengembangkan aplikasi multi-platform sesuai keahlian.'
  resume.skills.push({
    id: 's1',
    label: { en: 'Languages', id: 'Bahasa' },
    items: { en: 'TypeScript, JavaScript, Go', id: 'TypeScript, JavaScript, Go' },
  })
  resume.experience.push({
    id: 'x1',
    role: { en: 'Senior Backend Engineer', id: 'Senior Backend Engineer' },
    company: 'PT Teknologi Maju',
    city: 'Jakarta',
    start: '03/2022',
    end: null,
    bullets: [
      {
        en: 'Reduced API p95 latency by 40% via query optimization.',
        id: 'Mengurangi latency p95 API sebesar 40%.',
      },
      { en: 'Led migration to 12 microservices.', id: 'Memimpin migrasi ke 12 microservices.' },
    ],
    stack: 'TypeScript, NestJS, PostgreSQL',
  })
  resume.projects.push({
    id: 'p1',
    name: 'E-Commerce API',
    url: 'https://github.com/budisantoso/ecommerce-api',
    description: {
      en: 'Order/payment service with webhook support.',
      id: 'Layanan order/pembayaran dengan dukungan webhook.',
    },
    stack: 'NestJS, Redis',
    impact: { en: 'Handles 50k requests/day.', id: 'Melayani 50k request/hari.' },
  })
  resume.education.push({
    id: 'e1',
    level: 'university',
    degree: { en: 'S.Kom.', id: 'S.Kom.' },
    major: { en: 'Informatics Engineering', id: 'Teknik Informatika' },
    institution: 'Universitas Indonesia',
    city: 'Depok',
    year: '2020',
  })
  resume.certifications.push({
    id: 'c1',
    name: 'AWS Certified Developer – Associate',
    issuer: 'AWS',
    year: '2023',
  })
  resume.languages.push({
    id: 'l1',
    name: 'Bahasa Indonesia',
    proficiency: { en: 'native', id: 'penutur asli' },
  })
}

/** Extract all text from the generated PDF via pdfjs-dist (legacy, main thread). */
async function extractText(data: Uint8Array): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  let text = ''
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo)
    const content = await page.getTextContent()
    text += `${content.items.map((item) => ('str' in item ? item.str : '')).join(' ')}\n`
  }
  await loadingTask.destroy()
  return text
}

interface PdfItem {
  str: string
  x: number
  width: number
  height: number
  y: number
}

/** Extract positioned text items (baseline y, x, width, font height) for geometry assertions. */
async function extractItems(data: Uint8Array): Promise<PdfItem[]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  const items: PdfItem[] = []
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo)
    const content = await page.getTextContent()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      items.push({
        str: item.str,
        x: item.transform[4],
        width: item.width,
        height: item.height,
        y: item.transform[5],
      })
    }
  }
  await loadingTask.destroy()
  return items
}

describe('buildPdf', () => {
  it('generates a 1-page PDF with selectable text for a typical resume (EN)', async () => {
    const resume = createEmptyResume()
    fillResume(resume)

    const result = buildPdf(resume, 'en')

    expect(result.pages).toBe(1)
    expect(result.truncated).toBe(false)
    expect(result.data.length).toBeGreaterThan(500)

    const text = await extractText(result.data)
    expect(text).toContain('Budi Santoso')
    expect(text).toContain('Professional Summary')
    expect(text).toContain('Core Skills')
    expect(text).toContain('Work Experience')
    expect(text).toContain('Mar 2022 – Present')
    expect(text).toContain('Stack: TypeScript, NestJS, PostgreSQL')
    // Name and " — issuer | year" are drawn as two segments (bold vs normal), so
    // pdfjs extracts them as separate items — assert each segment individually.
    expect(text).toContain('AWS Certified Developer – Associate')
    expect(text).toContain('— AWS | 2023')
  })

  it('renders ID headings, month names and Sekarang when lang is id', async () => {
    const resume = createEmptyResume()
    fillResume(resume)

    const text = await extractText(buildPdf(resume, 'id').data)

    expect(text).toContain('Ringkasan Profil')
    expect(text).toContain('Keahlian Inti')
    expect(text).toContain('Pengalaman Kerja')
    expect(text).toContain('Mar 2022 – Sekarang')
    expect(text).toContain('Mengurangi latency p95 API sebesar 40%.')
  })

  it('places Education before Core Skills when educationPosition is top', async () => {
    const resume = createEmptyResume()
    fillResume(resume)
    resume.options.educationPosition = 'top'

    const text = await extractText(buildPdf(resume, 'en').data)

    const educationIndex = text.indexOf('Education')
    const skillsIndex = text.indexOf('Core Skills')
    expect(educationIndex).toBeGreaterThan(-1)
    expect(skillsIndex).toBeGreaterThan(-1)
    expect(educationIndex).toBeLessThan(skillsIndex)
  })

  it('caps at 2 pages and reports truncated for overflowing content', async () => {
    const resume = createEmptyResume()
    resume.personal.name = 'Siti Rahma'
    // 12 roles × 5 long bullets each — far beyond 2 pages.
    for (let i = 0; i < 12; i++) {
      resume.experience.push({
        id: `x${i}`,
        role: { en: `Backend Engineer ${i}`, id: `Backend Engineer ${i}` },
        company: `PT Perusahaan ${i}`,
        city: 'Jakarta',
        start: '01/2020',
        end: null,
        bullets: Array.from({ length: 5 }, (_, b) => ({
          en: `Long bullet ${b} about performance optimization, caching strategies, database indexing and API design for high-traffic systems.`,
          id: `Long bullet ${b} tentang optimasi performa, strategi caching, indexing database dan desain API untuk sistem lalu lintas tinggi.`,
        })),
        stack: 'Node.js, PostgreSQL, Redis, AWS',
      })
    }

    const result = buildPdf(resume, 'en')

    expect(result.pages).toBe(2)
    expect(result.truncated).toBe(true)
  })

  it('handles an empty resume without throwing (1 page, not truncated)', async () => {
    const resume = createEmptyResume()

    const result = buildPdf(resume, 'en')

    expect(result.pages).toBe(1)
    expect(result.truncated).toBe(false)
    expect(result.data.length).toBeGreaterThan(200)
    const text = await extractText(result.data)
    expect(text.trim()).toBe('')
  })

  it('renders an SMA education entry without GPA text', async () => {
    const resume = createEmptyResume()
    fillResume(resume)
    resume.education = [
      {
        id: 'sma1',
        level: 'sma',
        degree: { en: 'SMA', id: 'SMA' },
        major: { en: 'IPA', id: 'IPA' },
        institution: 'SMAN 1 Jakarta',
        city: 'Bandung',
        year: '2021',
        gpa: '3.9', // legacy data must not leak GPA for SMA entries
      },
    ]

    const text = await extractText(buildPdf(resume, 'en').data)

    expect(text).toContain('SMAN 1 Jakarta')
    expect(text).not.toContain('GPA')
  })

  it('keeps all text inside the content area, at body sizes, with no same-baseline overlaps', async () => {
    const resume = createEmptyResume()
    fillResume(resume)

    const items = await extractItems(buildPdf(resume, 'en').data)
    expect(items.length).toBeGreaterThan(30)

    // Right content edge = X0 + CONTENT_W = 555.58 pt; nothing may run past it.
    const maxRight = 556.58
    for (const item of items) {
      expect(
        item.x + item.width,
        `"${item.str}" runs past the right margin (right=${(item.x + item.width).toFixed(1)} pt)`,
      ).toBeLessThanOrEqual(maxRight)
    }

    // No two text items on the same baseline may overlap horizontally
    // (catches the bold skill-label colliding with its items).
    const rows = new Map<number, PdfItem[]>()
    for (const item of items) {
      const key = Math.round(item.y)
      const row = rows.get(key)
      if (row) row.push(item)
      else rows.set(key, [item])
    }
    for (const [, row] of rows) {
      const sorted = [...row].sort((a, b) => a.x - b.x)
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i]!.x - (sorted[i - 1]!.x + sorted[i - 1]!.width)
        expect(
          gap,
          `baseline ${sorted[i]!.y.toFixed(1)}: "${sorted[i - 1]!.str}" collides with "${sorted[i]!.str}" (gap ${gap.toFixed(1)} pt)`,
        ).toBeGreaterThanOrEqual(-0.1)
      }
    }

    // Summary and Languages are body text (10.5 pt), NOT the 12 pt heading font
    // (catches the drawLines font-state leak that rendered them bold 12 pt).
    const summary = items.find((i) => i.str.startsWith('Software developer with experience'))
    expect(summary).toBeDefined()
    expect(summary!.height).toBeGreaterThan(10)
    expect(summary!.height).toBeLessThan(11)
    const languages = items.find((i) => i.str.includes('Bahasa Indonesia (native)'))
    expect(languages).toBeDefined()
    expect(languages!.height).toBeGreaterThan(10)
    expect(languages!.height).toBeLessThan(11)
  })

  it('wraps a long role line instead of colliding with the right-aligned dates', async () => {
    const resume = createEmptyResume()
    fillResume(resume)
    const longRole =
      'Senior Backend Engineer & Platform Reliability Specialist, APAC Region (Singapore)'
    resume.experience[0]!.role.en = longRole
    resume.experience[0]!.role.id = longRole

    const items = await extractItems(buildPdf(resume, 'en').data)
    const firstLine = items.find((i) =>
      i.str.startsWith('Senior Backend Engineer & Platform Reliability Specialist'),
    )
    expect(firstLine).toBeDefined()
    const dates = items.find(
      (i) => i.str.includes('Mar 2022') && Math.abs(i.y - firstLine!.y) < 0.5,
    )
    expect(dates).toBeDefined()
    // The role wraps onto a continuation line below (BODY_LH = 14.2 pt apart),
    // so it can never collide with the right-aligned dates or run off the page.
    const continuation = items.find(
      (i) => Math.abs(i.y - (firstLine!.y - 14.2)) < 0.5 && i.str.includes('Teknologi Maju'),
    )
    expect(continuation).toBeDefined()
    expect(firstLine!.x + firstLine!.width).toBeLessThanOrEqual(dates!.x)
  })

  it('draws a bullet marker only on the first line of each bullet (no markers on wrapped continuation lines)', async () => {
    const resume = createEmptyResume()
    fillResume(resume)
    // First bullet is long enough to wrap at 10.5 pt within
    // CONTENT_W - BULLET_INDENT (503.88 pt); the second stays on one line.
    const longBullet =
      'Designed and implemented a scalable event-driven order processing pipeline handling ' +
      'thousands of concurrent transactions per second across multiple data centers, with ' +
      'comprehensive monitoring, alerting, retry and dead-letter queue handling, plus ' +
      'automated load testing and performance regression gates.'
    resume.experience = [
      {
        id: 'x-wrap',
        role: { en: 'Backend Engineer', id: 'Backend Engineer' },
        company: 'PT Uji',
        city: 'Jakarta',
        start: '', // no dates → the only indented items are bullet lines
        end: null,
        bullets: [
          { en: longBullet, id: longBullet },
          { en: 'Led on-call rotation.', id: 'Memimpin rotasi on-call.' },
        ],
        stack: '',
      },
    ]

    const items = await extractItems(buildPdf(resume, 'en').data)

    // Markers sit at the left margin (X0 = 39.7 pt); bullet text is hang-indented.
    const markers = items.filter((i) => i.str === '•')
    const indented = items.filter((i) => i.x >= 39.7 + 12 - 0.5)

    // Exactly one marker per bullet, positioned at the left margin.
    expect(markers).toHaveLength(2)
    for (const marker of markers) expect(marker.x).toBeCloseTo(39.7, 1)

    // First lines share their baseline with a marker; continuation lines never do.
    const markerYs = new Set(markers.map((m) => Math.round(m.y)))
    const firstLines = indented.filter((i) => markerYs.has(Math.round(i.y)))
    const continuationLines = indented.filter((i) => !markerYs.has(Math.round(i.y)))
    expect(firstLines).toHaveLength(2)
    // The long bullet must actually wrap for this test to be meaningful.
    expect(continuationLines.length).toBeGreaterThan(0)
    for (const line of continuationLines) {
      expect(markerYs.has(Math.round(line.y)), `continuation line "${line.str}" has a marker`).toBe(
        false,
      )
    }
  })
})
