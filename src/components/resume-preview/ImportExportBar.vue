<script setup lang="ts">
/**
 * JSON import/export toolbar for the preview panel (README: the preview panel
 * also contains import and export buttons). Talks to the store directly —
 * store.importJson / store.exportJson already hold all the logic; this
 * component adds only file I/O + toasts. `print:hidden` keeps it out of the
 * future print output.
 */
import { computed, ref } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'
import { downloadBlobFile, downloadTextFile } from '@/utils/download'
import { buildPdf } from '@/utils/pdf-export'
import { slugifyName } from '@/utils/resume-utils'

const store = useResumeStore()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)

/** Guard against multi-MB files being read into memory for no reason. */
const MAX_IMPORT_BYTES = 1_000_000

/** "Budi Santoso" → "resume-budi-santoso.json"; blank name → "resume.json". */
function exportFilename(): string {
  const slug = slugifyName(store.resume.personal.name)
  return slug ? `resume-${slug}.json` : 'resume.json'
}

function exportJson(): void {
  downloadTextFile(exportFilename(), store.exportJson(), 'application/json')
  toast.add({ title: 'Resume exported as JSON', color: 'success' })
}

/** Dynamic label makes the export-time language explicit (README: "as user selected"). */
const exportPdfLabel = computed(() => `Export PDF (${store.activeLang.toUpperCase()})`)

function exportPdf(): void {
  try {
    const result = buildPdf(store.resume, store.activeLang)
    const slug = slugifyName(store.resume.personal.name)
    const filename = `resume-${slug ? `${slug}-` : ''}${store.activeLang}.pdf`
    downloadBlobFile(filename, new Blob([result.data], { type: 'application/pdf' }))
    if (result.truncated) {
      toast.add({
        title: 'Resume is longer than 2 pages — the PDF was truncated.',
        color: 'warning',
      })
    } else {
      toast.add({ title: `Resume exported as PDF (${store.activeLang.toUpperCase()})`, color: 'success' })
    }
  } catch {
    toast.add({ title: 'Export failed: could not generate the PDF.', color: 'error' })
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
  <div class="flex items-center justify-end gap-2">
    <UButton
      variant="soft"
      :label="exportPdfLabel"
      data-testid="btn-export-pdf"
      @click="exportPdf"
    />
    <UButton
      variant="soft"
      label="Export JSON"
      data-testid="btn-export-json"
      @click="exportJson"
    />
    <UButton
      variant="soft"
      label="Import JSON"
      data-testid="btn-import-json"
      @click="fileInput?.click()"
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
