<script setup lang="ts">
/**
 * Export/import toolbar for the preview panel (README: the preview panel
 * also contains import and export buttons). Talks to the store directly —
 * store.importJson / store.exportJson already hold the data logic; the save
 * action comes from the shared useSaveToBrowser (same path as the Ctrl+S
 * hotkey); this component adds only file I/O + browser storage + toasts.
 * `print:hidden` keeps it out of the future print output.
 */
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { useSaveToBrowser } from '@/composables/useSaveToBrowser'
import { useResumeStore } from '@/composables/useResumeStore'
import { downloadBlobFile } from '@/utils/download'
import { buildPdf } from '@/utils/pdf-export'
import { slugifyName } from '@/utils/resume-utils'
import { createBundleZip } from '@/utils/zip'
import type { Lang } from '@/types/resume'

const store = useResumeStore()
const toast = useToast()
const { saveToBrowser } = useSaveToBrowser()
const fileInput = ref<HTMLInputElement | null>(null)
const lang = computed(() => store.activeLang)

/** Guard against multi-MB files being read into memory for no reason. */
const MAX_IMPORT_BYTES = 1_000_000

/** "Budi Santoso" → "resume-budi-santoso-"; blank name → "resume-". */
function nameBase(): string {
  const slug = slugifyName(store.resume.personal.name)
  return slug ? `resume-${slug}-` : 'resume-'
}

/** "Budi Santoso" → "resume-budi-santoso.json"; blank name → "resume.json". */
function exportJsonName(): string {
  const slug = slugifyName(store.resume.personal.name)
  return slug ? `resume-${slug}.json` : 'resume.json'
}

/** Both language PDFs are always exported (the bundle is language-complete, like the JSON). */
const EXPORT_LANGS: Lang[] = ['en', 'id']

/** One action exports both languages, so there is nothing to select — label follows activeLang. */
const exportBundleLabel = computed(() =>
  lang.value === 'id' ? 'Ekspor PDF EN+ID + JSON' : 'Export EN + ID PDF + JSON',
)
const importLabel = computed(() => (lang.value === 'id' ? 'Impor JSON' : 'Import JSON'))
const saveLabel = computed(() => (lang.value === 'id' ? 'Simpan ke Browser' : 'Save to Browser'))

/** One action exports the EN and ID PDFs + JSON as a single ZIP bundle. */
async function exportBundle(): Promise<void> {
  const base = nameBase()
  const jsonFilename = exportJsonName()
  const zipFilename = `${base}en-id.zip`

  let results: { lang: Lang; data: Uint8Array; truncated: boolean }[]
  try {
    // One jsPDF instance per language — buildPdf must never be shared across langs.
    results = EXPORT_LANGS.map((l) => ({ lang: l, ...buildPdf(store.resume, l) }))
  } catch {
    toast.add({
      title:
        lang.value === 'id' ? 'Ekspor gagal: tidak bisa membuat PDF.' : 'Export failed: could not generate the PDF.',
      color: 'error',
    })
    return
  }

  let bundle: Blob
  try {
    bundle = await createBundleZip([
      ...results.map(({ lang: l, data }) => ({ name: `${base}${l}.pdf`, content: data })),
      { name: jsonFilename, content: store.exportJson() },
    ])
  } catch {
    toast.add({
      title:
        lang.value === 'id' ? 'Ekspor gagal: tidak bisa membuat bundle.' : 'Export failed: could not create the bundle.',
      color: 'error',
    })
    return
  }

  try {
    downloadBlobFile(zipFilename, bundle)
  } catch {
    toast.add({
      title:
        lang.value === 'id' ? 'Ekspor gagal: tidak bisa memulai unduhan.' : 'Export failed: could not start the download.',
      color: 'error',
    })
    return
  }

  const truncatedLangs = results.filter((r) => r.truncated).map((r) => r.lang.toUpperCase())
  if (truncatedLangs.length > 0) {
    for (const l of truncatedLangs) {
      toast.add({
        title:
          lang.value === 'id'
            ? `Resume lebih dari 2 halaman — PDF ${l} terpotong.`
            : `Resume is longer than 2 pages — the ${l} PDF was truncated.`,
        color: 'warning',
      })
    }
  } else {
    toast.add({
      title:
        lang.value === 'id'
          ? 'Resume diekspor sebagai bundle PDF EN+ID + JSON'
          : 'Resume exported as EN + ID PDF + JSON bundle',
      color: 'success',
    })
  }
}

/** Map the store's distinct import-error strings to a single actionable toast title. */
function importErrorTitle(message: string): string {
  const isId = lang.value === 'id'
  switch (message) {
    case 'Invalid JSON':
      return isId ? 'Impor gagal: file bukan JSON yang valid.' : 'Import failed: file is not valid JSON.'
    case 'Unsupported resume.json version':
      return isId ? 'Impor gagal: versi resume.json tidak didukung.' : 'Import failed: unsupported resume.json version.'
    case 'Invalid resume.json structure':
      return isId ? 'Impor gagal: file bukan resume.json.' : 'Import failed: file is not a resume.json.'
    default:
      return isId ? 'Impor gagal.' : 'Import failed.'
  }
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > MAX_IMPORT_BYTES) {
    toast.add({
      title: lang.value === 'id' ? 'Impor gagal: file lebih besar dari 1 MB.' : 'Import failed: file is larger than 1 MB.',
      color: 'error',
    })
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    const result = store.importJson(text)
    if (result.ok) {
      toast.add({
        title: lang.value === 'id' ? 'Resume diimpor — siap diedit.' : 'Resume imported — ready to edit.',
        color: 'success',
      })
    } else {
      toast.add({ title: importErrorTitle(result.errors[0] ?? ''), color: 'error' })
    }
    // Reset on BOTH paths so picking the same file again fires `change`.
    input.value = ''
  }
  reader.onerror = () => {
    toast.add({
      title: lang.value === 'id' ? 'Impor gagal: tidak bisa membaca file.' : 'Import failed: could not read the file.',
      color: 'error',
    })
    input.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-2">
    <UButton
      variant="soft"
      :label="exportBundleLabel"
      data-testid="btn-export-bundle"
      @click="exportBundle"
    />
    <UButton
      variant="soft"
      :label="importLabel"
      data-testid="btn-import-json"
      @click="fileInput?.click()"
    />
    <UButton
      variant="soft"
      :label="saveLabel"
      data-testid="btn-save-local"
      @click="saveToBrowser"
    />
    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="hidden"
      data-testid="import-input"
      @change="onFileChange"
    />
  </div>
</template>
