<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'
import { MAX_SKILL_GROUPS } from '@/types/resume'
import { FORM_SECTIONS, sectionHeading } from './sections'

const store = useResumeStore()
const { removed } = useRemoveNotify()
const section = FORM_SECTIONS.find((s) => s.key === 'skills')!
const heading = computed(() => sectionHeading(section, store.activeLang))

function removeSkillGroup(id: string): void {
  store.removeSkillGroup(id)
  removed('Skill group')
}
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 space-y-4 border-b border-gray-200 pb-6">
    <h2 class="text-lg font-semibold">{{ heading }}</h2>
    <p class="text-sm text-gray-500">
      Comma-separated values, max {{ MAX_SKILL_GROUPS }} groups — ATS-safe (no bars, no tables).
    </p>

    <div
      v-for="group in store.resume.skills"
      :key="group.id"
      class="space-y-3 rounded-lg border border-gray-200 p-4"
      data-testid="skill-group"
    >
      <UFormField :label="`Group label (${store.activeLang.toUpperCase()})`">
        <UInput v-model="group.label[store.activeLang]" placeholder="Languages" />
      </UFormField>
      <UFormField :label="`Skills (${store.activeLang.toUpperCase()})`">
        <UTextarea
          v-model="group.items[store.activeLang]"
          rows="2"
          placeholder="TypeScript, JavaScript, Go, SQL"
        />
      </UFormField>
      <UButton
        variant="ghost"
        color="error"
        size="xs"
        label="Remove group"
        @click="removeSkillGroup(group.id)"
      />
    </div>

    <UButton
      v-if="store.resume.skills.length < MAX_SKILL_GROUPS"
      variant="soft"
      label="Add skill group"
      data-testid="add-skill-group"
      @click="store.addSkillGroup"
    />
  </section>
</template>
