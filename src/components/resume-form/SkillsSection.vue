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
const lang = computed(() => store.activeLang)

function removeSkillGroup(id: string): void {
  store.removeSkillGroup(id)
  removed(lang.value === 'id' ? 'Grup keahlian' : 'Skill group')
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
          ? `Nilai pisah koma, maks ${MAX_SKILL_GROUPS} grup — ATS-safe (tanpa bar/tabel).`
          : `Comma-separated values, max ${MAX_SKILL_GROUPS} groups — ATS-safe (no bars, no tables).`
      }}
    </p>

    <div
      v-for="(group, index) in store.resume.skills"
      :key="group.id"
      class="space-y-3 rounded-lg border border-gray-200 p-4"
      :class="{ 'opacity-60': !group.visible }"
      data-testid="skill-group"
    >
      <div class="flex items-center justify-between gap-2">
        <UCheckbox
          v-model="group.visible"
          :label="lang === 'id' ? 'Tampilkan di resume' : 'Show in resume'"
          :data-testid="`skill-visible-${index}`"
        />
        <span v-if="!group.visible" class="text-xs text-gray-400">{{
          lang === 'id' ? 'Disembunyikan dari pratinjau & PDF' : 'Hidden from preview & PDF'
        }}</span>
      </div>
      <UFormField
        :label="`${lang === 'id' ? 'Label grup' : 'Group label'} (${store.activeLang.toUpperCase()})`"
      >
        <UInput v-model="group.label[store.activeLang]" placeholder="Languages" />
      </UFormField>
      <UFormField :label="`${lang === 'id' ? 'Keahlian' : 'Skills'} (${store.activeLang.toUpperCase()})`">
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
        :label="lang === 'id' ? 'Hapus grup' : 'Remove group'"
        @click="removeSkillGroup(group.id)"
      />
    </div>

    <UButton
      v-if="store.resume.skills.length < MAX_SKILL_GROUPS"
      variant="soft"
      :label="lang === 'id' ? 'Tambah grup keahlian' : 'Add skill group'"
      data-testid="add-skill-group"
      @click="store.addSkillGroup"
    />
  </section>
</template>
