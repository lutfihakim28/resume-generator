<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeProject(id: string): void {
  store.removeProject(id)
  removed('Project')
}

const entry = computed(() => store.resume.projects.find((p) => p.id === props.entryId)!)
const lang = computed(() => store.activeLang)
</script>

<template>
  <div class="space-y-3 rounded-lg border border-gray-200 p-4" data-testid="project-entry">
    <div class="grid grid-cols-2 gap-4">
      <UFormField label="Project name">
        <UInput v-model="entry.name" placeholder="E-Commerce API" />
      </UFormField>
      <UFormField label="URL (optional)">
        <UInput v-model="entry.url" placeholder="github.com/budisantoso/ecommerce-api" />
      </UFormField>
    </div>

    <UFormField label="Stack (comma-separated)">
      <UInput v-model="entry.stack" placeholder="NestJS, PostgreSQL, Redis" />
    </UFormField>

    <UFormField :label="`Description (${lang.toUpperCase()})`">
      <UTextarea
        v-model="entry.description[lang]"
        rows="2"
        placeholder="Order/payment/stock service with webhook support."
      />
    </UFormField>

    <UFormField :label="`Impact (${lang.toUpperCase()})`">
      <UTextarea
        v-model="entry.impact[lang]"
        rows="2"
        placeholder="One measurable outcome, if any."
      />
    </UFormField>

    <UButton
      variant="ghost"
      color="error"
      size="xs"
      label="Remove project"
      data-testid="remove-project"
      @click="removeProject(entry.id)"
    />
  </div>
</template>
