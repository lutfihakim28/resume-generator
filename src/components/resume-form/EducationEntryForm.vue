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
</script>

<template>
  <div class="space-y-3 rounded-lg border border-gray-200 p-4" data-testid="education-entry">
    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="`Degree (${lang.toUpperCase()})`">
        <UInput v-model="entry.degree[lang]" placeholder="S.Kom." />
      </UFormField>
      <UFormField :label="`Major (${lang.toUpperCase()})`">
        <UInput
          v-model="entry.major[lang]"
          placeholder="Informatics Engineering / Teknik Informatika"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <UFormField label="University">
        <UInput v-model="entry.university" placeholder="Universitas Indonesia" />
      </UFormField>
      <UFormField label="City">
        <UInput v-model="entry.city" placeholder="Depok" />
      </UFormField>
      <UFormField label="Year">
        <UInput v-model="entry.year" placeholder="2020" />
      </UFormField>
    </div>

    <UFormField label="GPA (optional)">
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
