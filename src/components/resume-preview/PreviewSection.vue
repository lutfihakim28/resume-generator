<script setup lang="ts">
/**
 * Section shell for the resume sheet — 12pt bold heading with a 0.6pt accent
 * rule, per docs/research/software-developer-template.md §3.4.
 */
defineProps<{ heading: string }>()
</script>

<template>
  <section class="mt-[10pt]">
    <h2
      class="border-b-[0.6pt] border-[#1E5AA8] pb-[2pt] text-[12pt] font-bold leading-tight text-[#1F2430]"
    >
      {{ heading }}
    </h2>
    <div class="mt-[4pt] space-y-2">
      <slot />
    </div>
  </section>
</template>
