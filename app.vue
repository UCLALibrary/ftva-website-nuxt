<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()
const { enabled, state } = usePreviewMode()
// console.log('App.vue', enabled.value, state.token)
const route = useRoute()

const globalStore = useGlobalStore()
const { header, setHeader } = useHeader()
setHeader(globalStore)
const classes = ref(['layout',
  'layout-default'])
const primaryMenuItems = computed(() => {
  // convert file to typescript if we want to use '?' operator to avoid this
  // ex: return globalStore?.header?.primary
  return header?.value?.primary
})
watch(globalStore.header, (newVal, oldVal) => {
  // console.log('Global store changed for draft previews', newVal, oldVal)
  setHeader(globalStore)
})
const { $layoutData } = useNuxtApp()
onMounted(async () => {
  // globalstore state is lost due to 404 error for draft previews, this is hack to repopulate state on client side
  // console.log('No layout query', route.query, 'preview enabled', enabled.value, 'state?.token', state?.token)
  if (!import.meta.dev && (route.query?.preview === 'true' || enabled.value) && (route.query?.token !== undefined || state?.token !== undefined)) {
    await $layoutData()
  }
})

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
    <div :class="classes">
      <site-brand-bar class="brand-bar" />
      <header-sticky
        v-if="primaryMenuItems"
        class="primary"
        :primary-items="primaryMenuItems"
      />
      <NuxtPage />
      <footer
        class="ftva-footer"
        data-test="footer"
      >
        <footer-main />
      </footer>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.layout-default {
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-content: center;
  align-items: center;

  :deep(>*) {
    width: 100%;
  }

  flex: 1 1 auto;

  .brand-bar {
    width: 100%;
    z-index: 100;
  }

  .primary {
    position: sticky;
    will-change: top;
  }

  // .ftva-footer {
  .ftva.footer-main {
    padding-top: 120px;
    background-color: red;
  }

  .ftva.footer-main__blue {
    background-color: blue;
  }

  @media #{$small} {
    .brand-bar {
      display: none;
    }
  }
}
</style>
