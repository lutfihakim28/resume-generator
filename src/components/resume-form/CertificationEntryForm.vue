<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { useRemoveNotify } from '@/composables/useRemoveNotify'

const props = defineProps<{ entryId: string }>()
const store = useResumeStore()
const { removed } = useRemoveNotify()
const lang = computed(() => store.activeLang)

const entry = computed(() => store.resume.certifications.find((c) => c.id === props.entryId)!)

function removeCertification(id: string): void {
  store.removeCertification(id)
  removed(lang.value === 'id' ? 'Sertifikasi' : 'Certification')
}
</script>

<template>
  <div
    class="flex items-end gap-4 rounded-lg border border-gray-200 p-4"
    data-testid="certification-entry"
  >
    <UFormField :label="lang === 'id' ? 'Sertifikasi' : 'Certification'" class="flex-1">
      <UInput v-model="entry.name" placeholder="AWS Certified Developer – Associate" />
    </UFormField>
    <UFormField :label="lang === 'id' ? 'Penerbit' : 'Issuer'" class="flex-1">
      <UInput v-model="entry.issuer" placeholder="Amazon Web Services" />
    </UFormField>
    <UFormField :label="lang === 'id' ? 'Tahun' : 'Year'" class="w-28">
      <UInput v-model="entry.year" placeholder="2023" />
    </UFormField>
    <UButton
      variant="ghost"
      color="error"
      size="xs"
      :label="lang === 'id' ? 'Hapus' : 'Remove'"
      data-testid="remove-certification"
      @click="removeCertification(entry.id)"
    />
  </div>
</template>
