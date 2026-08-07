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
  resume.summary.en = 'Backend engineer with 4+ years building APIs for fintech products.'
  resume.summary.id = 'Backend engineer dengan 4+ tahun membangun API untuk produk fintech.'
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
    degree: { en: 'S.Kom.', id: 'S.Kom.' },
    major: { en: 'Informatics Engineering', id: 'Teknik Informatika' },
    university: 'Universitas Indonesia',
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
    expect(text).toContain('AWS Certified Developer – Associate — AWS | 2023')
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
})
