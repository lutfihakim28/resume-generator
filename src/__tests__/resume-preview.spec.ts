import { beforeEach, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import { useResumeStore } from '@/composables/useResumeStore'
import type { Resume } from '@/types/resume'
import ResumePreview from '../components/resume-preview/ResumePreview.vue'

/** Preview is pure HTML — no stubs needed. */
function mountPreview() {
  return mount(ResumePreview)
}

/** Fill a realistic mid-level developer resume (dev-hybrid-id-no-photo sample). */
function fillResume(resume: Resume): void {
  resume.personal.name = 'Budi Santoso'
  resume.personal.title.en = 'Backend Software Engineer · Node.js · TypeScript'
  resume.personal.title.id = 'Backend Software Engineer · Node.js · TypeScript'
  resume.personal.phone = '+62 812-XXXX-XXXX'
  resume.personal.email = 'budi.santoso@email.com'
  resume.personal.city = 'Jakarta, Indonesia'
  resume.personal.github = 'github.com/budisantoso'
  resume.personal.linkedin = 'linkedin.com/in/budisantoso'
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
    ],
    stack: 'TypeScript, NestJS, PostgreSQL',
  })
  resume.projects.push({
    id: 'p1',
    name: 'E-Commerce API',
    url: 'github.com/budisantoso/ecommerce-api',
    description: {
      en: 'Order/payment service with webhook support.',
      id: 'Layanan order/pembayaran.',
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

describe('ResumePreview', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
  })

  it('shows a hint instead of a broken sheet for an empty resume', () => {
    const wrapper = mountPreview()
    expect(wrapper.find('[data-testid="preview-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Your resume preview')
    expect(wrapper.find('[data-testid="preview-header"]').exists()).toBe(false)
  })

  it('renders the header: name, title, contact and links', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    const wrapper = mountPreview()

    const header = wrapper.find('[data-testid="preview-header"]')
    expect(header.text()).toContain('Budi Santoso')
    expect(header.text()).toContain('Backend Software Engineer · Node.js · TypeScript')
    expect(header.text()).toContain(
      '+62 812-XXXX-XXXX · budi.santoso@email.com · Jakarta, Indonesia',
    )
    expect(header.text()).toContain('github.com/budisantoso · linkedin.com/in/budisantoso')
  })

  it('renders only sections that have content', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    store.resume.skills = []
    const wrapper = mountPreview()

    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings).not.toContain('Core Skills')
    expect(headings).toContain('Professional Summary')
    expect(headings).toContain('Work Experience')
    expect(headings).toContain('Projects')
    expect(headings).toContain('Education')
    expect(headings).toContain('Certifications')
    expect(headings).toContain('Languages')
  })

  it('renders experience with formatted dates and Present for a current role', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    const wrapper = mountPreview()

    const text = wrapper.text()
    expect(text).toContain('Senior Backend Engineer — PT Teknologi Maju, Jakarta')
    expect(text).toContain('Mar 2022 – Present')
    expect(text).toContain('Reduced API p95 latency by 40% via query optimization.')
    expect(text).toContain('Stack: TypeScript, NestJS, PostgreSQL')
  })

  it('uses ID headings, month names and Sekarang when the active language is id', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    store.activeLang = 'id'
    const wrapper = mountPreview()

    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings).toContain('Ringkasan Profil')
    expect(headings).toContain('Pengalaman Kerja')
    expect(headings).toContain('Pendidikan')
    expect(wrapper.text()).toContain('Mar 2022 – Sekarang')
    expect(wrapper.text()).toContain('Mengurangi latency p95 API sebesar 40%.')
    expect(wrapper.text()).toContain('Bahasa Indonesia (penutur asli)')
  })

  it('places Education after Projects by default (mid-level)', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    const wrapper = mountPreview()

    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings.indexOf('Projects')).toBeLessThan(headings.indexOf('Education'))
    expect(headings.indexOf('Education')).toBeLessThan(headings.indexOf('Certifications'))
  })

  it('places Education right after Summary for fresh graduates (option)', async () => {
    const store = useResumeStore()
    fillResume(store.resume)
    store.resume.options.educationPosition = 'top'
    const wrapper = mountPreview()
    await wrapper.vm.$nextTick()

    const headings = wrapper.findAll('h2').map((h) => h.text())
    expect(headings.indexOf('Education')).toBeLessThan(headings.indexOf('Core Skills'))
  })

  it('hides the photo by default and shows it only when opted in with a URL', async () => {
    const store = useResumeStore()
    fillResume(store.resume)
    const wrapper = mountPreview()

    expect(wrapper.find('[data-testid="preview-photo"]').exists()).toBe(false)

    store.resume.options.showPhoto = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="preview-photo"]').exists()).toBe(false)

    store.resume.personal.photoUrl = 'https://example.com/budi.jpg'
    await wrapper.vm.$nextTick()
    const photo = wrapper.find('[data-testid="preview-photo"]')
    expect(photo.exists()).toBe(true)
    expect(photo.attributes('src')).toBe('https://example.com/budi.jpg')
  })

  it('updates live when the store changes after mount', async () => {
    const store = useResumeStore()
    const wrapper = mountPreview()

    store.resume.personal.name = 'Siti Rahma'
    store.resume.summary.en = 'Frontend engineer.'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="preview-empty"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="preview-header"]').text()).toContain('Siti Rahma')
    expect(wrapper.text()).toContain('Frontend engineer.')
  })

  it('shows an ended role with an explicit end date', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    store.resume.experience[0]!.end = '02/2025'
    const wrapper = mountPreview()

    expect(wrapper.text()).toContain('Mar 2022 – Feb 2025')
  })

  it('keeps raw date text when it is not MM/YYYY (no silent typo hiding)', () => {
    const store = useResumeStore()
    fillResume(store.resume)
    store.resume.experience[0]!.start = 'March 2022'
    const wrapper = mountPreview()

    expect(wrapper.text()).toContain('March 2022 – Present')
  })
})
