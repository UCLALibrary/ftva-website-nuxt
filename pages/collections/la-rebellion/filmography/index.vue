<script lang="ts" setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionFilmography from '../gql/queries/FTVACollectionFilmography.gql'
import ListOfItemsCollection from '~/components/ListOfItemsCollection.vue'

// UTILS
import parseFieldForBreadcrumbTitleOverride from '~/utils/parseBreadcrumbTitles'

const { $graphql } = useNuxtApp()

const route = useRoute()
/** 1) Normalize the path once (remove trailing slash), keep '/' for root */
const normalizedPath = computed(() => {
  const p = route.path.replace(/\/+$/, '')
  return p === '' ? '/' : p
})

/** 2) Map canonical paths only (no trailing slashes) */
const routeNameToSectionMap = {
  '/collections/la-rebellion/filmography': 'ftvaCollectionListingLARebellion',
  '/collections/in-the-life/episodes': 'ftvaCollectionListingInTheLife',
}

const sectionHandle = computed(() => routeNameToSectionMap[normalizedPath.value])

const { data, error } = await useAsyncData(`${normalizedPath.value}-filmography`, async () => {
  // lookup slug based on routeNameToSlugMap
  const data: any = await $graphql.default.request(FTVACollectionFilmography, { section: sectionHandle.value })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

definePageMeta({
  layout: 'default',
  path: '/collections/la-rebellion/filmography',
  alias: [
    '/collections/la-rebellion/filmography/',
    '/collections/in-the-life/episodes',
    '/collections/in-the-life/episodes/'
  ]
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.summary)
    }
  ]
})

// BREADCRUMB OVERRIDES
// Add value of new breadcrumb title to switch statement in the utility file
const breadcrumbOverrides = ref([
  {
    titleLevel: 2,
    updatedTitle: parseFieldForBreadcrumbTitleOverride(page?.value.sectionHandle) || null
  }
])
</script>

<template>
  <div class="page-component-wrapper">
    <ListOfItemsCollection
      :page="page"
      :breadcrumbs="breadcrumbOverrides"
    />
  </div>
</template>

<style scoped>
.page-component-wrapper {
  display: flex;
  flex-direction: column;
  margin: 0px;
  padding: 0px;
}
</style>
