<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'
import { validateExperienceDates } from '@/utils/validation'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()

function removeEntry(id: string): void {
  store.removeExperience(id)
  removed(lang.value === 'id' ? 'Entri pengalaman' : 'Experience entry')
}

function removeBullet(index: number): void {
  store.removeExperienceBullet(props.entryId, index)
  removed(lang.value === 'id' ? 'Poin' : 'Bullet')
}

/** Resolved from the store (not a prop) so v-model mutations stay lint-clean. */
const entry = computed(() => store.resume.experience.find((e) => e.id === props.entryId)!)
const lang = computed(() => store.activeLang)

const dateWarnings = computed(() => validateExperienceDates(entry.value, lang.value).map((w) => w.message))

const isPresent = computed({
  get: () => entry.value.end === null,
  set: (value: boolean) => {
    entry.value.end = value ? null : ''
  },
})

const endModel = computed({
  get: () => entry.value.end ?? '',
  set: (value: string) => {
    if (entry.value.end !== null) entry.value.end = value
  },
})
</script>

<template>
  <div
    class="space-y-3 rounded-lg border border-gray-200 p-4"
    :class="{ 'opacity-60': !entry.visible }"
    data-testid="experience-entry"
  >
    <div class="flex items-center justify-between gap-2">
      <UCheckbox
        v-model="entry.visible"
        :label="lang === 'id' ? 'Tampilkan di resume' : 'Show in resume'"
        data-testid="experience-visible"
      />
      <span v-if="!entry.visible" class="text-xs text-gray-400">{{
        lang === 'id' ? 'Disembunyikan dari pratinjau & PDF' : 'Hidden from preview & PDF'
      }}</span>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField :label="`${lang === 'id' ? 'Peran' : 'Role'} (${lang.toUpperCase()})`">
        <UInput v-model="entry.role[lang]" placeholder="Senior Backend Engineer" />
      </UFormField>
      <UFormField :label="lang === 'id' ? 'Perusahaan' : 'Company'">
        <UInput v-model="entry.company" placeholder="PT Teknologi Maju" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField :label="lang === 'id' ? 'Kota' : 'City'">
        <UInput v-model="entry.city" placeholder="Jakarta" />
      </UFormField>
      <UFormField
        :label="
          lang === 'id' ? 'Stack yang digunakan (pisah koma)' : 'Stack used (comma-separated)'
        "
      >
        <UInput v-model="entry.stack" placeholder="TypeScript, NestJS, PostgreSQL, AWS" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField :label="lang === 'id' ? 'Mulai (MM/YYYY)' : 'Start (MM/YYYY)'">
        <UInput v-model="entry.start" placeholder="03/2022" data-testid="input-start" />
      </UFormField>
      <UFormField :label="lang === 'id' ? 'Selesai (MM/YYYY)' : 'End (MM/YYYY)'">
        <UInput
          v-model="endModel"
          placeholder="02/2024"
          :disabled="isPresent"
          data-testid="input-end"
        />
      </UFormField>
    </div>

    <UCheckbox
      v-model="isPresent"
      :label="lang === 'id' ? 'Saat ini (peran sekarang)' : 'Present (current role)'"
      data-testid="checkbox-present"
    />

    <div v-for="(warning, index) in dateWarnings" :key="index" class="text-xs text-amber-600">
      {{ warning }}
    </div>

    <div class="space-y-3">
      <p class="text-sm font-medium text-gray-700">{{ lang === 'id' ? 'Poin-poin' : 'Bullets' }}</p>
      <div v-for="(bullet, index) in entry.bullets" :key="index" class="flex items-start gap-2">
        <UTextarea
          v-model="bullet[lang]"
          rows="2"
          class="flex-1"
          placeholder="Reduced API p95 latency by 40% via query optimization…"
          :data-testid="`input-bullet-${index}`"
        />
        <UButton
          variant="ghost"
          color="error"
          size="xs"
          :label="lang === 'id' ? 'Hapus' : 'Remove'"
          class="mt-1"
          :data-testid="`remove-bullet-${index}`"
          @click="removeBullet(index)"
        />
      </div>
      <UButton
        v-if="entry.bullets.length < 5"
        variant="soft"
        size="xs"
        :label="lang === 'id' ? 'Tambah poin' : 'Add bullet'"
        data-testid="add-bullet"
        @click="store.addExperienceBullet(entry.id)"
      />
    </div>

    <UButton
      variant="ghost"
      color="error"
      size="xs"
      :label="lang === 'id' ? 'Hapus entri' : 'Remove entry'"
      data-testid="remove-entry"
      @click="removeEntry(entry.id)"
    />
  </div>
</template>
