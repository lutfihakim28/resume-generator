<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useScrollspy } from '@nuxt/ui/composables'
import { useResumeStore } from '@/composables/useResumeStore'
import { FORM_SECTIONS, sectionHeading, sectionIncompleteCount } from './sections'

const store = useResumeStore()

/** jsdom has no IntersectionObserver — fall back to a scroll-position spy there. */
const ioSupported = typeof IntersectionObserver !== 'undefined'
const scrollSpy = ioSupported ? useScrollspy() : null
const fallbackActive = ref<string[]>([])
const activeHeadings = scrollSpy?.activeHeadings ?? fallbackActive

const sections = computed(() =>
  FORM_SECTIONS.map((section) => ({
    ...section,
    heading: sectionHeading(section, store.activeLang),
    incomplete: sectionIncompleteCount(store.resume, section.key),
  })),
)

function headingEl(id: string): HTMLElement | null {
  return document.getElementById(id)
}

function refreshHeadings(): void {
  if (!scrollSpy) return
  const elements = FORM_SECTIONS.map((s) => headingEl(s.id)).filter(
    (el): el is HTMLElement => el !== null,
  )
  scrollSpy.updateHeadings(elements)
}

function onScroll(): void {
  if (scrollSpy || typeof window === 'undefined') return
  const probe = 120
  let current = ''
  for (const section of FORM_SECTIONS) {
    const el = headingEl(section.id)
    if (el && el.getBoundingClientRect().top <= probe) current = section.id
  }
  fallbackActive.value = current ? [current] : []
}

function scrollToSection(id: string): void {
  const el = headingEl(id)
  if (!el) return
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    window.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
  }
}

onMounted(() => {
  refreshHeadings()
  if (!ioSupported && typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }
})

onBeforeUnmount(() => {
  if (!ioSupported && typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScroll)
  }
})

watch(() => store.resume.experience.length, refreshHeadings)
</script>

<template>
  <nav class="space-y-1 text-sm" aria-label="Form sections">
    <a
      v-for="section in sections"
      :key="section.id"
      href="#"
      class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5"
      :class="
        activeHeadings.includes(section.id)
          ? 'bg-blue-50 font-medium text-blue-700'
          : 'text-gray-600 hover:bg-gray-50'
      "
      @click.prevent="scrollToSection(section.id)"
    >
      <span>{{ section.heading }}</span>
      <span
        v-if="section.incomplete > 0"
        class="size-2 shrink-0 rounded-full bg-amber-400"
        :title="`${section.incomplete} ID field(s) empty`"
      />
    </a>
  </nav>
</template>
