<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()
const { enabled, state } = usePreviewMode()
</script>

<template>
  <div>
    <NuxtLoadingIndicator
      color="#ffe800"
      height="3"
    />
    <VueSkipTo
      to="#main"
      label="Skip to main content"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
