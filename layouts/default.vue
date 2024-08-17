<script setup>
import { provideTheme } from '@/composables/provideTheme'
provideTheme()

const globalStore = useGlobalStore()
const classes = ref(['layout',
  'layout-default',])

const primaryMenuItems = computed(() => {
  return globalStore.header.primary
})
const secondaryMenuItems = computed(() => {
  return globalStore.header.secondary
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
    <!--header
      v-show="!isMobile"
      class="header-main"
    >
      <site-brand-bar class="brand-bar" />
      <nav-secondary
        :items="secondaryMenuItems"
        :is-microsite="true"
      />
      <nav-primary
        class="primary"
        :items="primaryMenuItems"
        title="Film And Telivision Archive"
        acronym="FTVA"
      />
    </header>
    <header v-show="isMobile">
      <site-brand-bar class="brand-bar" />
      <header-main-responsive
        :primary-nav="primaryMenuItems"
        :secondary-nav="secondaryMenuItems"
        current-path="/about/foo/bar"
        title="Film And Telivision Archive"
        acronym="FTVA"
      />
    </header-->

    <slot />
    <!-- <pre>PRIMARY-- {{ globalStore.footerPrimary }}</pre>
    <pre>PRIMARY 2--- {{ globalStore.footerPrimary.nodes }}</pre> -->
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

    <!-- <pre>SOCKS---{{ globalStore.footerSock }}</pre> -->

    <!-- JEN Create a new Footer add 3 components-->
    <!-- 1. FooterPrimary is theme showing up-->
    <footer-primary :form="true" />

    <!-- 2. FooterLinks is theme showing up-->
    <footer-links />

    <!-- 3.FooterSock is theme showing up-->
    <footer-sock />
    <!-- THen check FooterMin -->
    <!-- Copy from Storybook use global store to pass data -->

    <!-- <footer>
      <footer-main />
    </footer> -->
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

}

.vue-skip-to {
  z-index: 300;
}

.header-main {
  z-index: 200;

  position: relative;
  height: 168px;

  .primary {
    position: absolute;
  }

  // TODO nav on smaller viewports
}

@media #{$medium} {
  .brand-bar {
    position: absolute;
    width: 100%;
  }
}
</style>
