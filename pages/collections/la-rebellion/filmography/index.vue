<script lang="ts" setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionFilmography from '../gql/queries/FTVACollectionFilmography.gql'
import ListOfItemsCollection from '~/components/ListOfItemsCollection.vue'

const { $graphql } = useNuxtApp()

const route = useRoute()
console.log('route path: ', route.path)

// routes this template/page supports:
const routeNameToSectionMap = {
  '/collections/la-rebellion/filmography': 'ftvaCollectionListingLARebellion',
  '/collections/in-the-life/filmography': 'ftvaCollectionListingInTheLife'
}

const { data, error } = await useAsyncData(`${route.path}-filmography`, async () => {
  // lookup slug based on routeNameToSlugMap
  const data = await $graphql.default.request(FTVACollectionFilmography, { section: routeNameToSectionMap[route.path] })
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
  alias: ['/collections/in-the-life/filmography']
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
</script>
<template>
  <div class="page-component-wrapper">
    <ListOfItemsCollection
      data-test="list-of-items-collection"
      :page="page"
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
