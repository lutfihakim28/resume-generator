import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { RESUME_STORAGE_KEY, useResumeStore } from '@/composables/useResumeStore'
import ImportExportBar from '../components/resume-preview/ImportExportBar.vue'

/**
 * Deterministic toast: the bar calls useToast().add() — assert on the spy
 * instead of the toast DOM (rendering needs the UApp provider, flaky in
 * jsdom). The download util and zip util are mocked too (they have their own
 * specs); here we only test the bar's wiring.
 */
const { toastAddSpy, downloadBlobSpy, buildPdfSpy, createBundleZipSpy } = vi.hoisted(() => ({
  toastAddSpy: vi.fn<(toast: { title: string; color: string }) => void>(),
  downloadBlobSpy: vi.fn<(filename: string, blob: Blob) => void>(),
  buildPdfSpy:
    vi.fn<
      (
        resume: unknown,
        lang: 'en' | 'id',
      ) => { data: Uint8Array; pages: number; truncated: boolean }
    >(),
  createBundleZipSpy:
    vi.fn<(files: { name: string; content: string | Uint8Array }[]) => Promise<Blob>>(),
}))

vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: toastAddSpy }),
}))

vi.mock('@/utils/download', () => ({
  downloadBlobFile: downloadBlobSpy,
}))

vi.mock('@/utils/pdf-export', () => ({
  buildPdf: buildPdfSpy,
}))

vi.mock('@/utils/zip', () => ({
  createBundleZip: createBundleZipSpy,
}))

function mountBar() {
  return mount(ImportExportBar)
}

/** Valid version-1 resume.json (only required keys; rest sanitized on import). */
function validResumeJson(name: string): string {
  return JSON.stringify({
    version: 1,
    personal: { name },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    languages: [],
  })
}

/** Stub the hidden input's FileList, fire `change`, and wait for the import to settle. */
async function pickFile(wrapper: ReturnType<typeof mountBar>, file: File): Promise<void> {
  const input = wrapper.find('[data-testid="import-input"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  const callsBefore = toastAddSpy.mock.calls.length
  await input.trigger('change')
  // Every path (success, error, size guard) ends with a toast — wait for it
  // instead of racing the async FileReader onload.
  await vi.waitFor(() => {
    if (toastAddSpy.mock.calls.length > callsBefore) return
    throw new Error('import not settled')
  })
}

describe('ImportExportBar', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
    localStorage.clear()
    toastAddSpy.mockClear()
    downloadBlobSpy.mockClear()
    buildPdfSpy.mockReset()
    buildPdfSpy.mockReturnValue({ data: new Uint8Array([1, 2, 3]), pages: 1, truncated: false })
    createBundleZipSpy.mockReset()
    createBundleZipSpy.mockResolvedValue(new Blob(['zip'], { type: 'application/zip' }))
  })

  it('renders one bundle export button and the import input', () => {
    const wrapper = mountBar()

    expect(wrapper.find('[data-testid="btn-export-bundle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-export-pdf"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="btn-export-json"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="btn-import-json"]').exists()).toBe(true)
    const input = wrapper.find('[data-testid="import-input"]')
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toBe('.json,application/json')
    expect(input.classes()).toContain('hidden')
  })

  it('exports EN + ID PDFs plus JSON in one click', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.personal.email = 'budi@email.com'
    const wrapper = mountBar()

    const button = wrapper.find('[data-testid="btn-export-bundle"]')
    // Static label — the export is always dual-language, there is no mode to select.
    expect(button.text()).toContain('Export EN + ID PDF + JSON')

    await button.trigger('click')
    await flushPromises()

    // Both language PDFs are built from the same resume, in en → id order.
    expect(buildPdfSpy).toHaveBeenCalledTimes(2)
    expect(buildPdfSpy.mock.calls[0]![0]).toBe(store.resume)
    expect(buildPdfSpy.mock.calls[0]![1]).toBe('en')
    expect(buildPdfSpy.mock.calls[1]![0]).toBe(store.resume)
    expect(buildPdfSpy.mock.calls[1]![1]).toBe('id')

    expect(createBundleZipSpy).toHaveBeenCalledTimes(1)
    const [files] = createBundleZipSpy.mock.calls[0]!
    expect(files).toHaveLength(3)
    expect(files[0]!.name).toBe('resume-budi-santoso-en.pdf')
    expect(files[0]!.content).toEqual(new Uint8Array([1, 2, 3]))
    expect(files[1]!.name).toBe('resume-budi-santoso-id.pdf')
    expect(files[1]!.content).toEqual(new Uint8Array([1, 2, 3]))
    expect(files[2]!.name).toBe('resume-budi-santoso.json')
    const parsed = JSON.parse(files[2]!.content as string)
    expect(parsed.version).toBe(1)
    expect(parsed.personal.name).toBe('Budi Santoso')

    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    const [zipName, blob] = downloadBlobSpy.mock.calls[0]!
    expect(zipName).toBe('resume-budi-santoso-en-id.zip')
    expect(blob.type).toBe('application/zip')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume exported as EN + ID PDF + JSON bundle',
        color: 'success',
      }),
    )
  })

  it('falls back to resume-en-id.zip with resume-en.pdf, resume-id.pdf, resume.json for a blank name', async () => {
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    const [files] = createBundleZipSpy.mock.calls[0]!
    expect(files[0]!.name).toBe('resume-en.pdf')
    expect(files[1]!.name).toBe('resume-id.pdf')
    expect(files[2]!.name).toBe('resume.json')
    expect(downloadBlobSpy.mock.calls[0]![0]).toBe('resume-en-id.zip')
  })

  it('warns per-language when a generated PDF was truncated past 2 pages (download still happens)', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockImplementation((_resume, lang) => ({
      data: new Uint8Array([1]),
      pages: 2,
      truncated: lang === 'id',
    }))
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    expect(createBundleZipSpy).toHaveBeenCalledTimes(1)
    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume is longer than 2 pages — the ID PDF was truncated.',
        color: 'warning',
      }),
    )
    // Only one warning: the EN PDF fit within 2 pages.
    const warnings = toastAddSpy.mock.calls.filter((call) => call[0]?.color === 'warning')
    expect(warnings).toHaveLength(1)
  })

  it('warns once per truncated language, EN first then ID', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockReturnValue({ data: new Uint8Array([1]), pages: 2, truncated: true })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    const warnings = toastAddSpy.mock.calls.filter((call) => call[0]?.color === 'warning')
    expect(warnings.map((call) => call[0]!.title)).toEqual([
      'Resume is longer than 2 pages — the EN PDF was truncated.',
      'Resume is longer than 2 pages — the ID PDF was truncated.',
    ])
    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast and aborts when PDF generation throws', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockImplementation(() => {
      throw new Error('boom')
    })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    // Aborts on the first build (en) — the map never reaches id.
    expect(buildPdfSpy).toHaveBeenCalledTimes(1)
    expect(createBundleZipSpy).not.toHaveBeenCalled()
    expect(downloadBlobSpy).not.toHaveBeenCalled()
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export failed: could not generate the PDF.',
        color: 'error',
      }),
    )
  })

  it('shows an error toast and aborts when the bundle cannot be created', async () => {
    useResumeStore().resetStore()
    createBundleZipSpy.mockRejectedValue(new Error('boom'))
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    // Both PDF builds succeed before the ZIP step rejects.
    expect(buildPdfSpy).toHaveBeenCalledTimes(2)
    expect(downloadBlobSpy).not.toHaveBeenCalled()
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export failed: could not create the bundle.',
        color: 'error',
      }),
    )
  })

  it('shows an error toast when the download itself throws', async () => {
    useResumeStore().resetStore()
    downloadBlobSpy.mockImplementation(() => {
      throw new Error('click')
    })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    // PDFs and ZIP were produced — only the browser download step failed.
    expect(buildPdfSpy).toHaveBeenCalledTimes(2)
    expect(createBundleZipSpy).toHaveBeenCalledTimes(1)
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export failed: could not start the download.',
        color: 'error',
      }),
    )
    // No success/warning toast after the failed download.
    const nonError = toastAddSpy.mock.calls.filter((call) => call[0]?.color !== 'error')
    expect(nonError).toHaveLength(0)
  })

  it('renders the save-to-browser button next to import', () => {
    const wrapper = mountBar()

    const button = wrapper.find('[data-testid="btn-save-local"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Save to Browser')
  })

  it('saves the current resume JSON to localStorage on click', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-save-local"]').trigger('click')

    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBe(store.exportJson())
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Resume saved to this browser.', color: 'success' }),
    )
  })

  it('shows the quota error toast and keeps the store intact when saving fails', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Siti Rahma'
    const wrapper = mountBar()

    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    try {
      await wrapper.find('[data-testid="btn-save-local"]').trigger('click')
    } finally {
      spy.mockRestore()
    }

    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()
    expect(store.resume.personal.name).toBe('Siti Rahma')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save failed: browser storage is full.',
        color: 'error',
      }),
    )
  })

  it('imports a valid resume.json and fills the store', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    const file = new File([validResumeJson('Siti Rahma')], 'resume.json', {
      type: 'application/json',
    })
    await pickFile(wrapper, file)

    expect(store.resume.personal.name).toBe('Siti Rahma')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Resume imported — ready to edit.', color: 'success' }),
    )
    // Input reset on success so the same file can be picked again.
    expect((wrapper.find('[data-testid="import-input"]').element as HTMLInputElement).value).toBe(
      '',
    )
  })

  it('rejects invalid JSON without touching the store', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    await pickFile(wrapper, new File(['not json'], 'bad.json', { type: 'application/json' }))

    expect(store.resume.personal.name).toBe('')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import failed: file is not valid JSON.',
        color: 'error',
      }),
    )
  })

  it('rejects unsupported resume.json versions', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    await pickFile(
      wrapper,
      new File([JSON.stringify({ version: 2, personal: { name: 'X' } })], 'v2.json', {
        type: 'application/json',
      }),
    )

    expect(store.resume.personal.name).toBe('')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import failed: unsupported resume.json version.',
        color: 'error',
      }),
    )
  })

  it('rejects structurally invalid resume.json files', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    await pickFile(
      wrapper,
      new File([JSON.stringify({ version: 1, personal: { name: 42 } })], 'bad-structure.json', {
        type: 'application/json',
      }),
    )

    expect(store.resume.personal.name).toBe('')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import failed: file is not a resume.json.',
        color: 'error',
      }),
    )
  })

  it('blocks files larger than 1 MB before reading them', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    const bigFile = new File([new Uint8Array(2_000_000)], 'big.json', {
      type: 'application/json',
    })
    await pickFile(wrapper, bigFile)

    expect(store.resume.personal.name).toBe('')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import failed: file is larger than 1 MB.',
        color: 'error',
      }),
    )
  })

  it('imports the same file twice in a row (input reset works)', async () => {
    const store = useResumeStore()
    const wrapper = mountBar()

    const file = new File([validResumeJson('Budi Santoso')], 'resume.json', {
      type: 'application/json',
    })
    await pickFile(wrapper, file)
    await pickFile(wrapper, file)

    expect(store.resume.personal.name).toBe('Budi Santoso')
    const successTitles = toastAddSpy.mock.calls.filter(
      (call) => call[0]?.title === 'Resume imported — ready to edit.',
    )
    expect(successTitles).toHaveLength(2)
  })
})
