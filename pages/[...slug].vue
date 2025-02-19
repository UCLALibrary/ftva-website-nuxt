<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors
import {
  TwoColLayoutWStickySideBar, NavBreadcrumb, ResponsiveImage, CardMeta, RichText, PageAnchor, FlexibleBlocks, SectionWrapper,
} from 'ucla-library-website-components'

import { onMounted } from 'vue'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVA_GENERAL_CONTENT_DETAIL from '../gql/queries/FTVAGeneralContentDetail.gql'

const { $graphql, $getHeaders } = useNuxtApp()

const route = useRoute()

const path = route.path.replace(/^\/|\/$/g, '') // trim initial and/or final slashes

// Because we gencontent page uses ftva / in the uri to differentiate between the lib and meat websites the GQL query will need the slug instead of the uri
const { data, error } = await useAsyncData(`general-content-${path}`, async () => {
  const data = await $graphql.default.request(FTVA_GENERAL_CONTENT_DETAIL, {
    slug: path.substring(
      path.lastIndexOf('/') + 1
    ),
  })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

if (data.value.entry && import.meta.prerender) {
  const { $elasticsearchplugin } = useNuxtApp()
  await $elasticsearchplugin.index(data.value.entry, path.replaceAll('/', '--'))
}

const page = ref(_get(data.value, 'entry', {}))

watch(data, (newVal, oldVal) => {
  // eslint-disable-next-line no-console
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
})

const h2Array = ref([]) // anchor tags

useHead({
  title: page.value ? page.value.title : '... loading'
})

const parseParentTitle = computed(() => {
  if (page.value.parent && page.value.parent.title)
    return page.value.parent.title

  return 'Home'
})

const parseTitle = computed(() => {
  if (page.value.formattedTitle)
    return page.value.formattedTitle
  else
    return page.value.title
})

onMounted(() => {
  // Call the plugin method to get the .section-header2 and .section-header3 elements
  h2Array.value = $getHeaders.getHeadersMethod()
})
</script>

<template lang="html">
  <main
    id="main"
    class="page page-general-content"
  >
    <NavBreadcrumb data-test="breadcrumb" />

    <code><strong>DATA:</strong> {{ page }}</code>

    <TwoColLayoutWStickySideBar>
      <template #primaryTop>
        <CardMeta
          data-test="text-block"
          :title="page.formattedTitle || page.title"
        >
          <!-- <template #customDescription>
            <rich-text :rich-text-content="page.text" />
          </template> -->
        </CardMeta>

        <DividerWayFinder class="remove-top-margin" />

        <FlexibleBlocks
          class="flexible-content"
          :blocks="page.blocks"
        />
      </template>
      <template #sidebarTop />
    </TwoColLayoutWStickySideBar>

    <PageAnchor
      v-if="h2Array.length >= 3"
      :section-titles="h2Array"
    />
  </main>
</template>

<style lang="scss" scoped>
.page-general-content {}
</style>
