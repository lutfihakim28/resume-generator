import { beforeEach, describe, expect, it, vi } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { useResumeStore } from '@/composables/useResumeStore'
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

  it('exports a PDF + JSON bundle in one click (EN)', async () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.personal.email = 'budi@email.com'
    const wrapper = mountBar()

    const button = wrapper.find('[data-testid="btn-export-bundle"]')
    expect(button.text()).toContain('Export PDF + JSON (EN)')

    await button.trigger('click')
    await flushPromises()

    expect(buildPdfSpy).toHaveBeenCalledTimes(1)
    expect(buildPdfSpy.mock.calls[0]![0]).toBe(store.resume)
    expect(buildPdfSpy.mock.calls[0]![1]).toBe('en')

    expect(createBundleZipSpy).toHaveBeenCalledTimes(1)
    const [files] = createBundleZipSpy.mock.calls[0]!
    expect(files).toHaveLength(2)
    expect(files[0]!.name).toBe('resume-budi-santoso-en.pdf')
    expect(files[0]!.content).toEqual(new Uint8Array([1, 2, 3]))
    expect(files[1]!.name).toBe('resume-budi-santoso.json')
    const parsed = JSON.parse(files[1]!.content as string)
    expect(parsed.version).toBe(1)
    expect(parsed.personal.name).toBe('Budi Santoso')

    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    const [zipName, blob] = downloadBlobSpy.mock.calls[0]!
    expect(zipName).toBe('resume-budi-santoso-en.zip')
    expect(blob.type).toBe('application/zip')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume exported as PDF + JSON bundle (EN)',
        color: 'success',
      }),
    )

    // Language change updates the label and the exported variant.
    store.activeLang = 'id'
    await wrapper.vm.$nextTick()
    expect(button.text()).toContain('Export PDF + JSON (ID)')
    await button.trigger('click')
    await flushPromises()
    expect(buildPdfSpy.mock.calls[1]![1]).toBe('id')
    expect(downloadBlobSpy.mock.calls[1]![0]).toBe('resume-budi-santoso-id.zip')
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume exported as PDF + JSON bundle (ID)',
        color: 'success',
      }),
    )
  })

  it('falls back to resume-en.zip with resume.json for a blank name', async () => {
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    const [files] = createBundleZipSpy.mock.calls[0]!
    expect(files[0]!.name).toBe('resume-en.pdf')
    expect(files[1]!.name).toBe('resume.json')
    expect(downloadBlobSpy.mock.calls[0]![0]).toBe('resume-en.zip')
  })

  it('warns when the generated PDF was truncated past 2 pages (download still happens)', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockReturnValue({ data: new Uint8Array([1]), pages: 2, truncated: true })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

    expect(createBundleZipSpy).toHaveBeenCalledTimes(1)
    expect(downloadBlobSpy).toHaveBeenCalledTimes(1)
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Resume is longer than 2 pages — the PDF was truncated.',
        color: 'warning',
      }),
    )
  })

  it('shows an error toast and aborts when PDF generation throws', async () => {
    useResumeStore().resetStore()
    buildPdfSpy.mockImplementation(() => {
      throw new Error('boom')
    })
    const wrapper = mountBar()

    await wrapper.find('[data-testid="btn-export-bundle"]').trigger('click')
    await flushPromises()

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

    expect(buildPdfSpy).toHaveBeenCalledTimes(1)
    expect(downloadBlobSpy).not.toHaveBeenCalled()
    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Export failed: could not create the bundle.',
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
