<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'
import { FORM_SECTIONS, sectionHeading } from './sections'

const store = useResumeStore()
const { removed } = useRemoveNotify()
const section = FORM_SECTIONS.find((s) => s.key === 'summary')!
const heading = computed(() => sectionHeading(section, store.activeLang))
const lang = computed(() => store.activeLang)

function removeSummary(id: string): void {
  store.removeSummary(id)
  removed(lang.value === 'id' ? 'Ringkasan' : 'Summary')
}
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-6 max-lg:scroll-mt-12 space-y-4 border-b border-gray-200 pb-6"
  >
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      {{
        lang === 'id'
          ? '2–3 baris: tahun + peran, cakupan stack, satu hasil terukur. Tambah beberapa varian — hanya yang terpilih tampil di pratinjau & PDF (klik kartu untuk memilih).'
          : '2–3 lines: years + role, stack breadth, one measurable outcome. Add multiple variants — only the selected one appears in preview & PDF (click card to select).'
      }}
    </p>

    <div v-if="store.resume.summaries.length === 0" class="text-sm text-gray-400">
      {{ lang === 'id' ? 'Belum ada ringkasan. Tambahkan di bawah.' : 'No summary yet. Add one below.' }}
    </div>

    <div
      v-for="(summary, index) in store.resume.summaries"
      :key="summary.id"
      tabindex="0"
      class="space-y-3 rounded-lg border border-gray-200 p-4 cursor-pointer transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      :class="{ 'border-blue-300 bg-blue-50/30 hover:border-blue-300': store.resume.selectedSummaryId === summary.id }"
      data-testid="summary-entry"
      @click="store.selectSummary(summary.id)"
      @keydown.enter.prevent="store.selectSummary(summary.id)"
      @keydown.space.prevent="store.selectSummary(summary.id)"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <span>{{ lang === 'id' ? 'Ringkasan' : 'Summary' }} {{ index + 1 }}</span>
          <span
            v-if="store.resume.selectedSummaryId === summary.id"
            class="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700"
            >{{ lang === 'id' ? 'Terpilih' : 'Selected' }}</span
          >
        </div>
        <input
          type="radio"
          name="selected-summary"
          :value="summary.id"
          :checked="store.resume.selectedSummaryId === summary.id"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
          :data-testid="`summary-radio-${index}`"
          @change="store.selectSummary(summary.id)"
        />
        <UButton
          variant="ghost"
          color="error"
          size="xs"
          :label="lang === 'id' ? 'Hapus' : 'Remove'"
          :data-testid="`remove-summary-${index}`"
          @click.stop="removeSummary(summary.id)"
        />
      </div>

      <UFormField
        :label="`${lang === 'id' ? 'Ringkasan' : 'Summary'} (${store.activeLang.toUpperCase()})`"
        class="w-full"
      >
        <UTextarea
          v-model="summary.content[store.activeLang]"
          :rows="4"
          placeholder="Backend engineer with 4+ years building APIs and microservices for fintech products…"
          class="w-full"
          :ui="{ root: 'w-full' }"
          :data-testid="index === 0 ? 'input-summary' : `input-summary-${index}`"
        />
      </UFormField>
    </div>

    <UButton
      variant="soft"
      :label="lang === 'id' ? 'Tambah ringkasan' : 'Add summary'"
      data-testid="add-summary"
      @click="store.addSummary()"
    />
  </section>
</template>
