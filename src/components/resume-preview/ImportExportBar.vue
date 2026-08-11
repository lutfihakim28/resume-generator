<script setup lang="ts">
/**
 * Export/import toolbar for the preview panel (README: the preview panel
 * also contains import and export buttons). Talks to the store directly —
 * store.importJson / store.exportJson already hold the data logic; the save
 * action comes from the shared useSaveToBrowser (same path as the Ctrl+S
 * hotkey); this component adds only file I/O + browser storage + toasts.
 * `print:hidden` keeps it out of the future print output.
 */
import { ref } from 'vue'
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

/** Static label — one action exports both languages, so there is nothing to select. */
const exportBundleLabel = 'Export EN + ID PDF + JSON'

/** One action exports the EN and ID PDFs + JSON as a single ZIP bundle. */
async function exportBundle(): Promise<void> {
  const base = nameBase()
  const jsonFilename = exportJsonName()
  const zipFilename = `${base}en-id.zip`

  let results: { lang: Lang; data: Uint8Array; truncated: boolean }[]
  try {
    // One jsPDF instance per language — buildPdf must never be shared across langs.
    results = EXPORT_LANGS.map((lang) => ({ lang, ...buildPdf(store.resume, lang) }))
  } catch {
    toast.add({ title: 'Export failed: could not generate the PDF.', color: 'error' })
    return
  }

  let bundle: Blob
  try {
    bundle = await createBundleZip([
      ...results.map(({ lang, data }) => ({ name: `${base}${lang}.pdf`, content: data })),
      { name: jsonFilename, content: store.exportJson() },
    ])
  } catch {
    toast.add({ title: 'Export failed: could not create the bundle.', color: 'error' })
    return
  }

  try {
    downloadBlobFile(zipFilename, bundle)
  } catch {
    toast.add({ title: 'Export failed: could not start the download.', color: 'error' })
    return
  }

  const truncatedLangs = results.filter((r) => r.truncated).map((r) => r.lang.toUpperCase())
  if (truncatedLangs.length > 0) {
    for (const lang of truncatedLangs) {
      toast.add({
        title: `Resume is longer than 2 pages — the ${lang} PDF was truncated.`,
        color: 'warning',
      })
    }
  } else {
    toast.add({ title: 'Resume exported as EN + ID PDF + JSON bundle', color: 'success' })
  }
}

/** Map the store's distinct import-error strings to a single actionable toast title. */
function importErrorTitle(message: string): string {
  switch (message) {
    case 'Invalid JSON':
      return 'Import failed: file is not valid JSON.'
    case 'Unsupported resume.json version':
      return 'Import failed: unsupported resume.json version.'
    case 'Invalid resume.json structure':
      return 'Import failed: file is not a resume.json.'
    default:
      return 'Import failed.'
  }
}

function onFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > MAX_IMPORT_BYTES) {
    toast.add({ title: 'Import failed: file is larger than 1 MB.', color: 'error' })
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    const result = store.importJson(text)
    if (result.ok) {
      toast.add({ title: 'Resume imported — ready to edit.', color: 'success' })
    } else {
      toast.add({ title: importErrorTitle(result.errors[0] ?? ''), color: 'error' })
    }
    // Reset on BOTH paths so picking the same file again fires `change`.
    input.value = ''
  }
  reader.onerror = () => {
    toast.add({ title: 'Import failed: could not read the file.', color: 'error' })
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
      label="Import JSON"
      data-testid="btn-import-json"
      @click="fileInput?.click()"
    />
    <UButton
      variant="soft"
      label="Save to Browser"
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
