<script setup>

const globalStore = useGlobalStore()

const primaryMenuItems = computed(() => {
  return globalStore.header.primary
})
const secondaryMenuItems = computed(() => {
  return globalStore.header.secondary
})
const isMobile = computed(() => {
  return globalStore.winWidth <= 1024
})

const classes = computed(() => {
  return [
    'layout',
    'layout-default',
    { 'has-scrolled': globalStore.sTop },
    { 'has-scrolled-past-header': globalStore.sTop >= 150 },
  ]
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

    <!--footer>
      <footer-primary
        v-if="globalStore.footerPrimary"
        :form="false"
      />
      <footer-sock v-if="globalStore.footerSock" />
    </footer-->
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
