<script setup>

// This layout is only used for error.vue page, for the rest of the page templates we have layout added to app.vue
import { provideTheme } from '@/composables/provideTheme'
provideTheme()

const { enabled, state } = usePreviewMode()

const globalStore = useGlobalStore()
// ✅ Fetch + hydrate Pinia (SSR + client)
useHydrateGlobalStore()

const classes = ref(['layout',
  'layout-default',])

const primaryMenuItems = computed(() => {
  // convert file to typescript if we want to use '?' operator to avoid this
  // ex: return globalStore?.header?.primary
  return globalStore && (globalStore.header && globalStore.header.primary) ? globalStore.header.primary : null
})

const isMobile = ref(false)
const { refresh } = useAlerts()

// globalstore state is lost when error page is generated , this is hack to repopulate state on client side
onMounted(() => {
  // console.log('In default layout', enabled.value, state?.token)

  classes.value.push({ 'has-scrolled': globalStore.sTop })
  classes.value.push({ 'has-scrolled-past-header': globalStore.sTop >= 150 })
  isMobile.value = globalStore.winWidth <= 1024
  refresh()
})

</script>
<template lang="html">
  <div :class="classes">
    <SiteNotificationBanner
      class="site-notification-banner"
      v-if="globalStore.globals.bannerAlert"
      :text="globalStore.globals.bannerAlert.text"
    />

    <!-- site brand bar only shows on desktop -->
    <site-brand-bar
      class="brand-bar"
      role="banner"
      aria-label="Site Logo"
    />
    <header-sticky
      v-if="primaryMenuItems"
      class="primary"
      :primary-items="primaryMenuItems"
    />
    <!-- Add this to the right place for dismissible alerts-->
    <!-- <SectionWrapper
      class="
      section-alert"
      theme="divider"
    >
      <site-notification-alert
        v-if="
          globalStore.globals.dismissibleAlert"
        class="dismissible-alert"
        v-bind="globalStore.globals.dismissibleAlert"
      />
      </SectionWrapper> -->
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
  flex: 1 1 auto;

  :deep(>*) {
    width: 100%;
  }

  .site-notification-banner {
    position: relative;
    z-index: 101;
    flex: 0 0 auto;
  }

  .brand-bar {
    width: 100%;
    z-index: 100;
  }

  .primary {
    position: sticky;
    will-change: top;
  }

  .section-alert {
    height: 0;
    position: relative;

    .dismissible-alert {
      position: absolute;
      z-index: 100;
      top: 32px;
      right: var(--unit-gutter);
    }
  }

  @media #{$small} {
    .brand-bar {
      display: none;
    }

    .primary {
      position: relative;
      top: auto;
      z-index: 100;
    }

    // Keep the mobile nav background inside HeaderSticky
    :deep(.ftva.nav-primary.primary .nav-background-fill) {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 64px;
    }

    // Keep the mobile site title inside the same 64px header
    :deep(.ftva.nav-primary.primary .item-top-mobile) {
      position: absolute;
      top: 0;
      left: 18px;
      height: 64px;
      display: flex;
      align-items: center;
    }

    // Keep search + hamburger inside that same header row
    :deep(.ftva.nav-primary.primary .more-menu) {
      position: absolute;
      top: 0;
      right: 18px;
      height: 64px;
      display: flex;
      align-items: center;
    }

    :deep(.header-sticky .nav-menu-item .sub-menu-item:has([href="/events/?view=calendar"])) {
      display: none;
    }
  }
}
</style>
