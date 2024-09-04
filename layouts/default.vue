<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()

const route = useRoute()

const globalStore = useGlobalStore()

const classes = ref(['layout',
  'layout-default',])
// pass global store from server to client using useState
const { footerPrimary,
  footerLinks,
  footerSock,
  setFooter } = useFooter()
setFooter(globalStore)

const primaryMenuItems = computed(() => {
  // convert file to typescript if we want to use '?' operator to avoid this
  // ex: return globalStore?.header?.primary
  return globalStore && (globalStore.header && globalStore.header.primary) ? globalStore.header.primary : null
})

const isMobile = ref(false)

onMounted(() => {
  console.log(route.query)
  if (route.query?.preview === 'true' && route.query?.token) {
    globalStore.footerLinks = footerLinks.value
    globalStore.footerPrimary = footerPrimary.value
    globalStore.footerSock = footerSock.value
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
