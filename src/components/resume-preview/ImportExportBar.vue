<script setup lang="ts">
/**
 * Export/import toolbar for the preview panel (README: the preview panel
 * also contains import and export buttons). Talks to the store directly —
 * store.importJson / store.exportJson / store.saveToLocalStorage already hold
 * all the logic; this component adds only file I/O + browser storage + toasts.
 * `print:hidden` keeps it out of the future print output.
 */
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'
import { downloadBlobFile } from '@/utils/download'
import { buildPdf } from '@/utils/pdf-export'
import { slugifyName } from '@/utils/resume-utils'
import { createBundleZip } from '@/utils/zip'

const store = useResumeStore()
const toast = useToast()
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

/** Dynamic label makes the export-time language explicit (README: "as user selected"). */
const exportBundleLabel = computed(() => `Export PDF + JSON (${store.activeLang.toUpperCase()})`)

/** One action button exports the PDF + JSON as a single ZIP bundle. */
async function exportBundle(): Promise<void> {
  const lang = store.activeLang
  const base = nameBase()
  const pdfFilename = `${base}${lang}.pdf`
  const jsonFilename = exportJsonName()
  const zipFilename = `${base}${lang}.zip`

  let result: { data: Uint8Array; truncated: boolean }
  try {
    result = buildPdf(store.resume, lang)
  } catch {
    toast.add({ title: 'Export failed: could not generate the PDF.', color: 'error' })
    return
  }

  let bundle: Blob
  try {
    bundle = await createBundleZip([
      { name: pdfFilename, content: result.data },
      { name: jsonFilename, content: store.exportJson() },
    ])
  } catch {
    toast.add({ title: 'Export failed: could not create the bundle.', color: 'error' })
    return
  }

  downloadBlobFile(zipFilename, bundle)
  if (result.truncated) {
    toast.add({
      title: 'Resume is longer than 2 pages — the PDF was truncated.',
      color: 'warning',
    })
  } else {
    toast.add({
      title: `Resume exported as PDF + JSON bundle (${lang.toUpperCase()})`,
      color: 'success',
    })
  }
}

/** Map the store's distinct error strings to a single actionable toast title. */
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

/** Map the store's distinct save-error strings to a single actionable toast title. */
function saveErrorTitle(message: string): string {
  switch (message) {
    case 'Storage quota exceeded':
      return 'Save failed: browser storage is full.'
    case 'Storage unavailable':
      return 'Save failed: browser storage is not available.'
    default:
      return 'Save failed.'
  }
}

/** Manual save of the current resume JSON to this browser's localStorage. */
function saveToBrowser(): void {
  const result = store.saveToLocalStorage()
  if (result.ok) {
    toast.add({ title: 'Resume saved to this browser.', color: 'success' })
  } else {
    toast.add({ title: saveErrorTitle(result.errors[0] ?? ''), color: 'error' })
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
