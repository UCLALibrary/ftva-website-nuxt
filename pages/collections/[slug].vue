<script lang="ts" setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import { CardMeta, DividerWayFinder, FlexibleMediaGalleryNewLightbox, NavBreadcrumb, ResponsiveImage, RichText, SectionTeaserCard, SectionWrapper, TwoColLayoutWStickySideBar } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionDetail from '../gql/queries/FTVACollectionDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`collections-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionDetail, { slug: route.params.slug })
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaCollection) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaCollection', {}))
// const series = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaEvent', {})
  // series.value = _get(newVal, 'ftvaEventSeries', {})
})

// TODO page metadata title
useHead({
  title: page.value?.title || '... loading',
  // meta: [
  //   {
  //     hid: 'description',
  //     name: 'description',
  //     content: 'The UCLA Library creates a vibrant nexus of ideas, collections, expertise, and spaces in which users illuminate solutions for local and global challenges. We constantly evolve to advance UCLA’s research, education, and public service mission by empowering and inspiring communities of scholars and learners to discover, access, create, share, and preserve knowledge.',
  //   },
  // ],
})
</script>
<template>
  <main
    id="main"
    class="page page-collection-detail"
  >
    {{ page }}
  </main>
</template>
<style lang="scss" scoped>
.page-collection-detail {
  position: relative;

  // TODO move this element to global mixin or something
  &:before {
    content: '';
    position: absolute;
    background-color: var(--pale-blue);
    aspect-ratio: 1440 / 520;
    max-height: 518px; //prevent overflow on large screens
    min-height: 225px; //prevent too much shrinking on small screens
    width: 100%;
    z-index: -1;
  }

  // TODO global?
  .one-column {
    width: 100%;
    max-width: var(--max-width);
    margin: 0 auto;

    :deep(.nav-breadcrumb) {
      padding: 0px;
    }
  }

  // TODO global?
  .full-width {
    width: 100%;
    background-color: var(--pale-blue);
    margin: 0 auto;

    .section-wrapper.theme-paleblue {
      background-color: var(--pale-blue);
    }
  }
}
</style>