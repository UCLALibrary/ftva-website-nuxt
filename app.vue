<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()
const { enabled, state } = usePreviewMode()
console.log(enabled, state?.value?.token)
const route = useRoute()
const { $layoutData } = useNuxtApp()
const globalStore = useGlobalStore()

const classes = ref(['layout',
  'layout-default',])
const draftPrimaryMenuItems = computed(() => {
  // convert file to typescript if we want to use '?' operator to avoid this
  // ex: return globalStore?.header?.primary
  return globalStore && (globalStore.header && globalStore.header.primary) ? globalStore.header.primary : null
})
onMounted(async () => {
  // globalstore state is lost due to 404 error for draft previews, this is hack to repopulate state on client side
  console.log(route.query)
  if (route.query?.preview === 'true' && route.query?.token) {
    await $layoutData()
  }
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator
      color="#ffe800"
      :height="3"
    />
    <VueSkipTo
      to="#main"
      label="Skip to main content"
    />
    <NuxtLayout v-if="(!enabled && route.query?.token === undefined) || (enabled && route.query?.token === undefined)">
      <NuxtPage />
    </NuxtLayout>
    <div
      v-else
      :class="classes"
    >
      <ClientOnly>
        <site-brand-bar class="brand-bar" />
        <header-sticky
          v-if="draftPrimaryMenuItems"
          class="primary"
          :primary-items="draftPrimaryMenuItems"
        />
      </ClientOnly>
      <NuxtPage />
      <ClientOnly>
        <footer data-test="footer">
          <footer-main />
        </footer>
      </ClientOnly>
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
