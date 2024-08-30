<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()

const globalStore = useGlobalStore()
const classes = ref(['layout',
  'layout-default',])

const primaryMenuItems = computed(() => {
  return globalStore.header.primary // TODO this needs a fallback when header.primary does not exist
})

const isMobile = computed(() => {
  return globalStore.winWidth <= 1024
})

onMounted(() => {
  classes.value.push({ 'has-scrolled': globalStore.sTop })
  classes.value.push({ 'has-scrolled-past-header': globalStore.sTop >= 150 })
})

</script>
<template lang="html">
  <div :class="classes">
    <!-- site brand bar only shows on desktop -->
    <site-brand-bar class="brand-bar" />
    <header-sticky
      class="primary"
      :primary-items="primaryMenuItems"
    />

    <slot />
    <div
      v-if="$route.path === '/'"
      style="padding: 50px 250px"
    >
      <hr>
      <pre>FOOTER Primary {{ globalStore.footerPrimary }}</pre>
      <hr>
      <pre>FOOTER LINKS{{ globalStore.footerLinks }}</pre>
      <hr>
    </div>

    <footer>
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
