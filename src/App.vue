<script setup lang="ts">
import ResumeFormPanel from '@/components/resume-form/ResumeFormPanel.vue'
import ResumePreview from '@/components/resume-preview/ResumePreview.vue'
</script>

<template>
  <UApp>
    <div class="grid h-screen grid-cols-2 overflow-hidden">
      <ResumeFormPanel class="h-full overflow-y-auto border-r border-gray-200" />
      <ResumePreview />
    </div>
  </UApp>
</template>
