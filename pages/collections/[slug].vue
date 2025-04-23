<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionLayoutType from '../gql/queries/FTVACollectionType.gql'

// CHILD COMPONENTS
import { BasicCollection, ListOfItemsCollection, StorytellingCollection } from '#components'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`collections-layout-type-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionLayoutType, { slug: route.params.slug })
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
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'ftvaCollection', {})
})

// Compute layout
const pageType = computed(() => {
  const collectionpagetype = _get(data.value, 'ftvaCollection.ftvaCollectionLayoutType', 'basic')
  if (collectionpagetype === 'listOfItems') {
    return ListOfItemsCollection
  } else if (collectionpagetype === 'storytelling') {
    return StorytellingCollection
  } else {
    return BasicCollection // default to basic
  }
})
</script>
<template>
  <!-- pass page as attrs so ElasticSearch powered pages don't have to fetch craftCMS page data again -->
  <component
    :is="pageType"
    :page="page"
  />
</template>
<style lang="scss" scoped></style>