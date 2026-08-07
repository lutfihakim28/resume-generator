<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeEducation(id: string): void {
  store.removeEducation(id)
  removed('Education entry')
}

const entry = computed(() => store.resume.education.find((e) => e.id === props.entryId)!)
const lang = computed(() => store.activeLang)

/** University/Universitas ↔ SMA/Senior High School — mirrors the educationPosition UTabs pattern. */
const levelItems = computed(() => [
  { label: lang.value === 'id' ? 'Universitas' : 'University', value: 'university' },
  { label: lang.value === 'id' ? 'SMA' : 'Senior High School', value: 'sma' },
])
const isSma = computed(() => entry.value?.level === 'sma')
const institutionLabel = computed(() => {
  if (lang.value === 'id') return isSma.value ? 'Sekolah' : 'Universitas'
  return isSma.value ? 'School' : 'University'
})
const institutionPlaceholder = computed(() =>
  isSma.value ? 'SMAN 1 Jakarta' : 'Universitas Indonesia',
)
const degreePlaceholder = computed(() =>
  isSma.value ? (lang.value === 'id' ? 'SMA' : 'Senior High School') : 'S.Kom.',
)
const majorPlaceholder = computed(() =>
  isSma.value ? 'IPA / IPS' : 'Informatics Engineering / Teknik Informatika',
)
</script>

<template>
  <div class="space-y-3 rounded-lg border border-gray-200 p-4" data-testid="education-entry">
    <UTabs
      v-model="entry.level"
      :items="levelItems"
      variant="segment"
      :content="false"
      data-testid="education-level"
    />

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField :label="`Degree (${lang.toUpperCase()})`">
        <UInput v-model="entry.degree[lang]" :placeholder="degreePlaceholder" />
      </UFormField>
      <UFormField :label="`Major (${lang.toUpperCase()})`">
        <UInput v-model="entry.major[lang]" :placeholder="majorPlaceholder" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <UFormField :label="institutionLabel">
        <UInput v-model="entry.institution" :placeholder="institutionPlaceholder" />
      </UFormField>
      <UFormField label="City">
        <UInput v-model="entry.city" placeholder="Depok" />
      </UFormField>
      <UFormField label="Year">
        <UInput v-model="entry.year" placeholder="2020" />
      </UFormField>
    </div>

    <UFormField v-if="entry.level === 'university'" label="GPA (optional)">
      <UInput v-model="entry.gpa" placeholder="3.7 / 4.0" />
    </UFormField>

    <UButton
      variant="ghost"
      color="error"
      size="xs"
      label="Remove education"
      data-testid="remove-education"
      @click="removeEducation(entry.id)"
    />
  </div>
</template>
