<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeLanguage(id: string): void {
  store.removeLanguage(id)
  removed('Language')
}

const entry = computed(() => store.resume.languages.find((l) => l.id === props.entryId)!)
const lang = computed(() => store.activeLang)
</script>

<template>
  <div
    class="flex items-end gap-4 rounded-lg border border-gray-200 p-4"
    data-testid="language-entry"
  >
    <UFormField label="Language" class="flex-1">
      <UInput v-model="entry.name" placeholder="English" />
    </UFormField>
    <UFormField :label="`Proficiency (${lang.toUpperCase()})`" class="flex-1">
      <UInput v-model="entry.proficiency[lang]" placeholder="Professional / Profesional" />
    </UFormField>
    <UButton
      variant="ghost"
      color="error"
      size="xs"
      label="Remove"
      data-testid="remove-language"
      @click="removeLanguage(entry.id)"
    />
  </div>
</template>
