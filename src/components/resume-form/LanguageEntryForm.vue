<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeLanguage(id: string): void {
  store.removeLanguage(id)
  removed(lang.value === 'id' ? 'Bahasa' : 'Language')
}

const entry = computed(() => store.resume.languages.find((l) => l.id === props.entryId)!)
const lang = computed(() => store.activeLang)
</script>

<template>
  <div
    class="space-y-3 rounded-lg border border-gray-200 p-4"
    :class="{ 'opacity-60': entry.visible === false }"
    data-testid="language-entry"
  >
    <div class="flex items-center justify-between gap-2">
      <UCheckbox
        v-model="entry.visible"
        :label="lang === 'id' ? 'Tampilkan di resume' : 'Show in resume'"
        data-testid="language-visible"
      />
      <span v-if="entry.visible === false" class="text-xs text-gray-400">{{
        lang === 'id' ? 'Disembunyikan dari pratinjau & PDF' : 'Hidden from preview & PDF'
      }}</span>
    </div>
    <div class="flex items-end gap-4">
      <UFormField :label="lang === 'id' ? 'Bahasa' : 'Language'" class="flex-1">
        <UInput v-model="entry.name" placeholder="English" />
      </UFormField>
      <UFormField
        :label="`${lang === 'id' ? 'Kemahiran' : 'Proficiency'} (${lang.toUpperCase()})`"
        class="flex-1"
      >
        <UInput v-model="entry.proficiency[lang]" placeholder="Professional / Profesional" />
      </UFormField>
      <UButton
        variant="ghost"
        color="error"
        size="xs"
        :label="lang === 'id' ? 'Hapus' : 'Remove'"
        data-testid="remove-language"
        @click="removeLanguage(entry.id)"
      />
    </div>
  </div>
</template>
