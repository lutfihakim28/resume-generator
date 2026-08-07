/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Resume Editor' })).toBeVisible()
  // Form section headings render (template §3.3 order starts with Personal).
  await expect(page.getByRole('heading', { name: 'Personal' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Work Experience' })).toBeVisible()
})

test('ID tab switches the form language', async ({ page }) => {
  await page.goto('/')
  // exact: true — name matching is substring+case-insensitive by default and
  // 'ID' would also match the Options tab "Bottom (mid-level)".
  await page.getByRole('tab', { name: 'ID', exact: true }).click()
  // Headings + field labels follow the active language.
  await expect(page.getByRole('heading', { name: 'Data Pribadi' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pengalaman Kerja' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Keahlian Inti' })).toBeVisible()
})

test('live preview reflects form input in real time', async ({ page }) => {
  await page.goto('/')
  // Fresh resume → empty-state hint in the preview panel.
  await expect(page.getByTestId('preview-empty')).toBeVisible()

  // Typing the name + summary swaps the preview to the rendered sheet.
  await page.getByTestId('input-name').fill('Budi Santoso')
  await page.getByTestId('input-summary').fill('Backend engineer with 4+ years in fintech.')
  await expect(page.getByTestId('preview-empty')).toBeHidden()
  await expect(page.getByTestId('preview-header')).toContainText('Budi Santoso')
  await expect(page.getByTestId('preview-sheet')).toContainText('Professional Summary')
  await expect(page.getByTestId('preview-sheet')).toContainText(
    'Backend engineer with 4+ years in fintech.',
  )
})

test('exports the resume as a JSON file', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('input-name').fill('Budi Santoso')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('btn-export-json').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('resume-budi-santoso.json')
  const path = await download.path()
  expect(path).not.toBeNull()
  const content = readFileSync(path!, 'utf-8')
  const parsed = JSON.parse(content)
  expect(parsed.version).toBe(1)
  expect(parsed.personal.name).toBe('Budi Santoso')
})

test('imports a resume.json into the form and preview', async ({ page }) => {
  await page.goto('/')

  const resume = {
    version: 1,
    personal: {
      name: 'Siti Rahma',
      title: { en: 'Frontend Engineer', id: '' },
      phone: '',
      email: 'siti@email.com',
      city: 'Bandung',
      github: '',
      linkedin: '',
      portfolio: '',
      photoUrl: '',
    },
    summary: { en: 'Frontend engineer with 3 years of experience.', id: '' },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
  }
  await page.getByTestId('import-input').setInputFiles({
    name: 'resume.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(resume)),
  })

  // Form input fills automatically and the preview renders the imported data.
  await expect(page.getByTestId('input-name')).toHaveValue('Siti Rahma')
  await expect(page.getByTestId('preview-header')).toContainText('Siti Rahma')
  await expect(page.getByTestId('preview-sheet')).toContainText(
    'Frontend engineer with 3 years of experience.',
  )
})

test('shows an error toast for invalid JSON import', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('preview-empty')).toBeVisible()

  await page.getByTestId('import-input').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json'),
  })

  // The real browser renders toasts (UApp provider) — assert the mapped error.
  await expect(page.getByText('Import failed', { exact: false })).toBeVisible()
  // The preview stayed in the empty state: import did not mutate anything.
  await expect(page.getByTestId('preview-empty')).toBeVisible()
})

/** Extract all text from a downloaded PDF (pdfjs-dist legacy, main thread). */
async function extractPdfText(filePath: string): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = getDocument({
    data: new Uint8Array(readFileSync(filePath)),
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

test('exports the resume as a PDF with selectable text (EN)', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('input-name').fill('Budi Santoso')
  await page.getByTestId('input-summary').fill('Backend engineer with 4+ years in fintech.')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('btn-export-pdf').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('resume-budi-santoso-en.pdf')
  const filePath = await download.path()
  expect(filePath).not.toBeNull()
  const bytes = readFileSync(filePath!)
  // Real PDF magic bytes — the browser actually downloaded a PDF.
  expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF')
  // Selectable text (ATS-safe, template §5): name + section heading survive.
  const text = await extractPdfText(filePath!)
  expect(text).toContain('Budi Santoso')
  expect(text).toContain('Professional Summary')
})

test('exports an ID-language PDF when the ID tab is active', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('input-name').fill('Siti Rahma')
  await page.getByRole('tab', { name: 'ID', exact: true }).click()
  await page.getByTestId('input-summary').fill('Frontend engineer dengan 3 tahun pengalaman.')

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('btn-export-pdf').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('resume-siti-rahma-id.pdf')
  const filePath = await download.path()
  expect(filePath).not.toBeNull()
  const text = await extractPdfText(filePath!)
  expect(text).toContain('Ringkasan Profil')
  expect(text).toContain('Frontend engineer dengan 3 tahun pengalaman.')
})
