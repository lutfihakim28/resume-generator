<script setup lang="ts">
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import { validateResume } from '@/utils/validation'
import { sectionHeading } from './sections'
import { FORM_SECTIONS } from './sections'

const store = useResumeStore()
const section = FORM_SECTIONS.find((s) => s.key === 'personal')!

const errors = computed(() => validateResume(store.resume).errors)
const emailWarning = computed(() => validateResume(store.resume).warnings.email)
const heading = computed(() => sectionHeading(section, store.activeLang))
</script>

<template>
  <section
    :id="section.id"
    class="scroll-mt-6 max-lg:scroll-mt-12 space-y-4 border-b border-gray-200 pb-6"
  >
    <h2 class="text-lg font-semibold">{{ heading }}</h2>

    <UFormField label="Name" :error="errors.name" required>
      <UInput
        v-model="store.resume.personal.name"
        placeholder="Budi Santoso"
        data-testid="input-name"
      />
    </UFormField>

    <UFormField :label="`Title (${store.activeLang.toUpperCase()})`">
      <UInput
        v-model="store.resume.personal.title[store.activeLang]"
        placeholder="Backend Software Engineer · Node.js · TypeScript"
        data-testid="input-title"
      />
    </UFormField>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField label="Phone">
        <UInput
          v-model="store.resume.personal.phone"
          placeholder="+62 812-XXXX-XXXX"
          data-testid="input-phone"
        />
      </UFormField>
      <UFormField label="Email" :error="emailWarning">
        <UInput
          v-model="store.resume.personal.email"
          type="email"
          placeholder="budi.santoso@email.com"
          data-testid="input-email"
        />
      </UFormField>
    </div>

    <UFormField label="City">
      <UInput
        v-model="store.resume.personal.city"
        placeholder="Jakarta, Indonesia"
        data-testid="input-city"
      />
    </UFormField>

    <div class="grid grid-cols-1 gap-4">
      <UFormField v-if="store.resume.options.showPhoto" label="Photo URL (optional)">
        <UInput
          v-model="store.resume.personal.photoUrl"
          placeholder="https://example.com/photo.jpg"
          data-testid="input-photo-url"
        />
      </UFormField>
      <UFormField label="GitHub (optional)">
        <UInput
          v-model="store.resume.personal.github"
          placeholder="github.com/budisantoso"
          data-testid="input-github"
        />
      </UFormField>
      <UFormField label="LinkedIn (optional)">
        <UInput
          v-model="store.resume.personal.linkedin"
          placeholder="linkedin.com/in/budisantoso"
          data-testid="input-linkedin"
        />
      </UFormField>
      <UFormField label="Portfolio (optional)">
        <UInput
          v-model="store.resume.personal.portfolio"
          placeholder="https://budisantoso.dev"
          data-testid="input-portfolio"
        />
      </UFormField>
    </div>
  </section>
</template>
