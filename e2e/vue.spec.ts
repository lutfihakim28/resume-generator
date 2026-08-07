/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import JSZip from 'jszip'

// See here how to get started:
// https://playwright.dev/docs/intro

/**
 * The mobile tab branch is always in the DOM (CSS-hidden at lg+), so
 * data-testid queries in these desktop-viewport tests are scoped to the
 * visible side-by-side layout to stay unambiguous.
 */
function desktop(page: Page): Locator {
  return page.getByTestId('desktop-layout')
}

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
  await expect(desktop(page).getByTestId('preview-empty')).toBeVisible()

  // Typing the name + summary swaps the preview to the rendered sheet.
  await desktop(page).getByTestId('input-name').fill('Budi Santoso')
  await desktop(page)
    .getByTestId('input-summary')
    .fill('Backend engineer with 4+ years in fintech.')
  await expect(desktop(page).getByTestId('preview-empty')).toBeHidden()
  await expect(desktop(page).getByTestId('preview-header')).toContainText('Budi Santoso')
  await expect(desktop(page).getByTestId('preview-sheet')).toContainText('Professional Summary')
  await expect(desktop(page).getByTestId('preview-sheet')).toContainText(
    'Backend engineer with 4+ years in fintech.',
  )
})

test('exports a PDF + JSON bundle (EN)', async ({ page }) => {
  await page.goto('/')
  await desktop(page).getByTestId('input-name').fill('Budi Santoso')
  await desktop(page)
    .getByTestId('input-summary')
    .fill('Backend engineer with 4+ years in fintech.')

  const downloadPromise = page.waitForEvent('download')
  await desktop(page).getByTestId('btn-export-bundle').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('resume-budi-santoso-en.zip')
  const filePath = await download.path()
  expect(filePath).not.toBeNull()

  const zip = await JSZip.loadAsync(readFileSync(filePath!))

  // Inner PDF: real %PDF magic + selectable text (ATS-safe, template §5).
  const pdfBytes = await zip.file('resume-budi-santoso-en.pdf')!.async('uint8array')
  expect(Buffer.from(pdfBytes.subarray(0, 4)).toString('latin1')).toBe('%PDF')
  const text = await extractPdfText(new Uint8Array(pdfBytes))
  expect(text).toContain('Budi Santoso')
  expect(text).toContain('Professional Summary')

  // Inner JSON: full resume with version + name.
  const jsonEntry = await zip.file('resume-budi-santoso.json')!.async('string')
  const parsed = JSON.parse(jsonEntry)
  expect(parsed.version).toBe(1)
  expect(parsed.personal.name).toBe('Budi Santoso')
})

test('exports an ID-language bundle when the ID tab is active', async ({ page }) => {
  await page.goto('/')
  await desktop(page).getByTestId('input-name').fill('Siti Rahma')
  await page.getByRole('tab', { name: 'ID', exact: true }).click()
  await desktop(page)
    .getByTestId('input-summary')
    .fill('Frontend engineer dengan 3 tahun pengalaman.')

  const downloadPromise = page.waitForEvent('download')
  await desktop(page).getByTestId('btn-export-bundle').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('resume-siti-rahma-id.zip')
  const filePath = await download.path()
  expect(filePath).not.toBeNull()

  const zip = await JSZip.loadAsync(readFileSync(filePath!))
  const pdfBytes = await zip.file('resume-siti-rahma-id.pdf')!.async('uint8array')
  const text = await extractPdfText(new Uint8Array(pdfBytes))
  expect(text).toContain('Ringkasan Profil')
  expect(text).toContain('Frontend engineer dengan 3 tahun pengalaman.')
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
  await desktop(page)
    .getByTestId('import-input')
    .setInputFiles({
      name: 'resume.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(resume)),
    })

  // Form input fills automatically and the preview renders the imported data.
  await expect(desktop(page).getByTestId('input-name')).toHaveValue('Siti Rahma')
  await expect(desktop(page).getByTestId('preview-header')).toContainText('Siti Rahma')
  await expect(desktop(page).getByTestId('preview-sheet')).toContainText(
    'Frontend engineer with 3 years of experience.',
  )
})

test('shows an error toast for invalid JSON import', async ({ page }) => {
  await page.goto('/')
  await expect(desktop(page).getByTestId('preview-empty')).toBeVisible()

  await desktop(page)
    .getByTestId('import-input')
    .setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('not json'),
    })

  // The real browser renders toasts (UApp provider) — assert the mapped error.
  await expect(page.getByText('Import failed', { exact: false })).toBeVisible()
  // The preview stayed in the empty state: import did not mutate anything.
  await expect(desktop(page).getByTestId('preview-empty')).toBeVisible()
})

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows the form and review as tabs on mobile', async ({ page }) => {
    await page.goto('/')

    // Below lg the side-by-side grid is hidden and the tabs take over.
    await expect(page.getByTestId('desktop-layout')).toBeHidden()
    const tabs = page.getByTestId('mobile-tabs')
    await expect(tabs.getByRole('tab', { name: 'Form' })).toBeVisible()
    await expect(tabs.getByRole('tab', { name: 'Review' })).toBeVisible()

    // Form tab is active by default; the review panel stays hidden.
    await expect(tabs.getByTestId('input-name')).toBeVisible()
    await expect(tabs.getByTestId('preview-panel')).toBeHidden()

    // Switching to Review shows the preview; the form panel is hidden but stays mounted.
    await tabs.getByRole('tab', { name: 'Review' }).click()
    await expect(tabs.getByTestId('preview-panel')).toBeVisible()
    await expect(tabs.getByTestId('input-name')).toBeHidden()

    // Form data survives the round-trip (store-backed state).
    await tabs.getByRole('tab', { name: 'Form' }).click()
    await tabs.getByTestId('input-name').fill('Budi Santoso')
    await tabs.getByRole('tab', { name: 'Review' }).click()
    await expect(tabs.getByTestId('preview-header')).toContainText('Budi Santoso')
  })

  test('section navigation is a popup on mobile and never squeezes the form', async ({ page }) => {
    await page.goto('/')
    const tabs = page.getByTestId('mobile-tabs')

    // The nav bar is a slim sticky bar; opening it shows the section list
    // as an overlay popup, not a column beside the form.
    const toggle = tabs.getByTestId('sections-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    const popover = page.getByTestId('sections-popover')
    await expect(popover).toBeVisible()
    await expect(popover.getByRole('link', { name: /Core Skills/ })).toBeVisible()

    // Clicking a section scrolls to it and closes the popup.
    await popover.getByRole('link', { name: /Core Skills/ }).click()
    await expect(popover).toBeHidden()

    // The click must actually scroll the form panel to the section
    // (regression: a focus change during the popup close used to cancel the
    // smooth scroll, so taps appeared dead).
    const skillsSection = tabs.locator('#section-skills')
    await expect
      .poll(async () => skillsSection.evaluate((el) => el.getBoundingClientRect().top), {
        timeout: 3000,
      })
      .toBeGreaterThan(0)
    await expect
      .poll(async () => skillsSection.evaluate((el) => el.getBoundingClientRect().top), {
        timeout: 3000,
      })
      .toBeLessThan(160)

    // The form panel spans the full viewport width — nothing overflows.
    const overflows = await tabs.evaluate((el) => {
      const doc = el.ownerDocument
      const win = doc.defaultView
      return doc.documentElement.scrollWidth > (win?.innerWidth ?? 0)
    })
    expect(overflows).toBe(false)
  })
})

/** Extract all text from PDF bytes (pdfjs-dist legacy, main thread). */
async function extractPdfText(data: Uint8Array): Promise<string> {
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
