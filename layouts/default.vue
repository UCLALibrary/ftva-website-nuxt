<script setup>

// This layout is only used for error.vue page, for the rest of the page templates we have layout added to app.vue

import { provideTheme } from '@/composables/provideTheme'
provideTheme()

const { enabled, state } = usePreviewMode()
const layoutCustomProps = useAttrs()
const globalStore = useGlobalStore()

const classes = ref(['layout',
  'layout-default',])

const primaryMenuItems = computed(() => {
  // convert file to typescript if we want to use '?' operator to avoid this
  // ex: return globalStore?.header?.primary
  return globalStore && (globalStore.header && globalStore.header.primary) ? globalStore.header.primary : null
})

const isMobile = ref(false)
watch(globalStore, (newVal, oldVal) => {
  console.log('Global store changed', newVal, oldVal)
})
const { $layoutData } = useNuxtApp()
// globalstore state is lost when error page is generated , this is hack to repopulate state on client side
onMounted(async () => {
  console.log('In default layout', enabled.value, state?.token)

  if (process.env.NODE_ENV !== 'development' && layoutCustomProps['is-error']) {
    console.log('In SSG refresh layout data as state is not maintained after an error response')
    await $layoutData()
  }

  classes.value.push({ 'has-scrolled': globalStore.sTop })
  classes.value.push({ 'has-scrolled-past-header': globalStore.sTop >= 150 })
  isMobile.value = globalStore.winWidth <= 1024
})

</script>
<template lang="html">
  <div :class="classes">
    <!-- site brand bar only shows on desktop -->
    <site-brand-bar class="brand-bar" />
    <header-sticky
      v-if="primaryMenuItems"
      class="primary"
      :primary-items="primaryMenuItems"
    />
    <slot />
    <footer data-test="footer">
      <footer-main />
    </footer>
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

  @media #{$small} {
    .brand-bar {
      display: none;
    }
  }
}

.vue-skip-to {
  z-index: 300;
}
</style>
