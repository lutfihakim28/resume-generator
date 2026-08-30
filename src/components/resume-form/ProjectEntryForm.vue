<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeProject(id: string): void {
  store.removeProject(id)
  removed(lang.value === 'id' ? 'Proyek' : 'Project')
}

const entry = computed(() => store.resume.projects.find((p) => p.id === props.entryId)!)
const lang = computed(() => store.activeLang)
</script>

<template>
  <div
    class="space-y-3 rounded-lg border border-gray-200 p-4"
    :class="{ 'opacity-60': !entry.visible }"
    data-testid="project-entry"
  >
    <div class="flex items-center justify-between gap-2">
      <UCheckbox
        v-model="entry.visible"
        :label="lang === 'id' ? 'Tampilkan di resume' : 'Show in resume'"
        data-testid="project-visible"
      />
      <span v-if="!entry.visible" class="text-xs text-gray-400">{{
        lang === 'id' ? 'Disembunyikan dari pratinjau & PDF' : 'Hidden from preview & PDF'
      }}</span>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField :label="lang === 'id' ? 'Nama proyek' : 'Project name'">
        <UInput v-model="entry.name" placeholder="E-Commerce API" />
      </UFormField>
      <UFormField :label="lang === 'id' ? 'URL (opsional)' : 'URL (optional)'">
        <UInput v-model="entry.url" placeholder="github.com/budisantoso/ecommerce-api" />
      </UFormField>
    </div>

    <UFormField :label="lang === 'id' ? 'Stack (pisah koma)' : 'Stack (comma-separated)'">
      <UInput v-model="entry.stack" placeholder="NestJS, PostgreSQL, Redis" />
    </UFormField>

    <UFormField
      :label="`${lang === 'id' ? 'Deskripsi' : 'Description'} (${lang.toUpperCase()})`"
      class="w-full"
    >
      <UTextarea
        v-model="entry.description[lang]"
        rows="2"
        placeholder="Order/payment/stock service with webhook support."
        class="w-full"
        :ui="{ root: 'w-full' }"
      />
    </UFormField>

    <UFormField
      :label="`${lang === 'id' ? 'Dampak' : 'Impact'} (${lang.toUpperCase()})`"
      class="w-full"
    >
      <UTextarea
        v-model="entry.impact[lang]"
        rows="2"
        placeholder="One measurable outcome, if any."
        class="w-full"
        :ui="{ root: 'w-full' }"
      />
    </UFormField>

    <UButton
      variant="ghost"
      color="error"
      size="xs"
      :label="lang === 'id' ? 'Hapus proyek' : 'Remove project'"
      data-testid="remove-project"
      @click="removeProject(entry.id)"
    />
  </div>
</template>
