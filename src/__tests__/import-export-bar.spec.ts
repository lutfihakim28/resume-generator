import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { useResumeStore } from '@/composables/useResumeStore'
import ImportExportBar from '../components/resume-preview/ImportExportBar.vue'

/**
 * Deterministic toast: the bar calls useToast().add() — assert on the spy
 * instead of the toast DOM (rendering needs the UApp provider, flaky in
 * jsdom). The download util is mocked too (it has its own spec); here we
 * only test the bar's wiring.
 */
const { toastAddSpy, downloadSpy, downloadBlobSpy, buildPdfSpy } = vi.hoisted(() => ({
  toastAddSpy: vi.fn<(toast: { title: string; color: string }) => void>(),
  downloadSpy: vi.fn<(filename: string, content: string, mime: string) => void>(),
  downloadBlobSpy: vi.fn<(filename: string, blob: Blob) => void>(),
  buildPdfSpy:
    vi.fn<
      (
        resume: unknown,
        lang: 'en' | 'id',
      ) => { data: Uint8Array; pages: number; truncated: boolean }
    >(),
}))

vi.mock('@nuxt/ui/composables', () => ({
  useToast: () => ({ add: toastAddSpy }),
}))

vi.mock('@/utils/download', () => ({
  downloadTextFile: downloadSpy,
  downloadBlobFile: downloadBlobSpy,
}))

vi.mock('@/utils/pdf-export', () => ({
  buildPdf: buildPdfSpy,
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
    toastAddSpy.mockClear()
    downloadSpy.mockClear()
    downloadBlobSpy.mockClear()
    buildPdfSpy.mockReset()
    buildPdfSpy.mockReturnValue({ data: new Uint8Array([1, 2, 3]), pages: 1, truncated: false })
  })

  it('renders export/import buttons and a hidden JSON-only file input', () => {
    const wrapper = mountBar()

    expect(wrapper.find('[data-testid="btn-export-pdf"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-export-json"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-import-json"]').exists()).toBe(true)
    const input = wrapper.find('[data-testid="import-input"]')
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toBe('.json,application/json')
    expect(input.classes()).toContain('hidden')
  })

  it('labels the PDF button with the active language and downloads resume-<slug>-<lang>.pdf', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    const wrapper = mountBar()

    const button = wrapper.find('[data-testid="btn-export-pdf"]')
    expect(button.text()).toContain('Export PDF (EN)')

    await button.trigger('click')

    expect(buildPdfSpy).toHaveBeenCalledTimes(1)
    expect(buildPdfSpy.mock.calls[0]![1]).toBe('en')
    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    const [filename, blob] = downloadBlobSpy.mock.calls[0]!
    expect(filename).toBe('resume-budi-santoso-en.pdf')
    expect(blob.type).toBe('application/pdf')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Resume exported as PDF (EN)', color: 'success' }),
    )

    // Language change updates the label and the exported variant.
    store.activeLang = 'id'
    await wrapper.vm.$nextTick()
    expect(button.text()).toContain('Export PDF (ID)')
    await button.trigger('click')
    expect(downloadBlobSpy.mock.calls[1]![0]).toBe('resume-budi-santoso-id.pdf')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Resume exported as PDF (ID)', color: 'success' }),
    )
  })

  it('warns when the generated PDF was truncated past 2 pages', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockReturnValue({ data: new Uint8Array([1]), pages: 2, truncated: true })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-pdf"]').trigger('click')

    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume is longer than 2 pages — the PDF was truncated.',
        color: 'warning',
      }),
    )
  })

  it('shows an error toast when PDF generation throws', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockImplementation(() => {
      throw new Error('boom')
    })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-pdf"]').trigger('click')

    expect(downloadBlobSpy).not.toHaveBeenCalled()
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export failed: could not generate the PDF.',
        color: 'error',
      }),
    )
  })

  it('exports the resume as resume-<slug>.json with success toast', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.personal.email = 'budi@email.com'
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-json"]').trigger('click')

    expect(downloadSpy).toHaveBeenCalledTimes(1)
    const [filename, content, mime] = downloadSpy.mock.calls[0]!
    expect(filename).toBe('resume-budi-santoso.json')
    expect(mime).toBe('application/json')
    const parsed = JSON.parse(content)
    expect(parsed.version).toBe(1)
    expect(parsed.personal.name).toBe('Budi Santoso')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Resume exported as JSON', color: 'success' }),
    )
  })

  it('falls back to resume.json for a blank name', async () => {
    const wrapper = mountBar()
    await wrapper.find('[data-testid="btn-export-json"]').trigger('click')
    expect(downloadSpy.mock.calls[0]![0]).toBe('resume.json')
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
