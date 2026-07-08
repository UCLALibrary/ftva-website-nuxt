<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()
const { enabled, state } = usePreviewMode()
// console.log('App.vue', enabled.value, state.token)


// set title
useHead({
  titleTemplate: (titleChunk) => {
    // If undefined or blank then we don't need the pipe and space
    return titleChunk === 'Homepage'
      ? 'UCLA Film & Television Archive'
      : `${titleChunk || 'Error'} | UCLA Film & Television Archive`
  },
  htmlAttrs: {
    lang: 'en',
  },
  meta: [
    { charset: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0',
    },
  ],
  link: [
    { rel: 'icon', type: 'image/svg', href: '/icon-ucla-favicon.svg' },
  ],
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator
      color="#ffe800"
      :height="3"
    />
    <vue-skip-to
      to="#main"
      label="Skip to main content"
    />

    <!--div :class="classes">
      <site-brand-bar class="brand-bar" />
      <header-sticky
        v-if="primaryMenuItems"
        :key="route.query.q"
        class="primary"
        :primary-items="primaryMenuItems"
      />

      <NuxtPage />

      <footer-main data-test="footer"/>

    </div-->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="scss" scoped>
.vue-skip-to {
  z-index: 300;
}

:deep(.vue-skip-to__link) {
  background-color: var(--color-primary-yellow-01);
  color: var(--color-black);
  @include step-0;
}
</style>
