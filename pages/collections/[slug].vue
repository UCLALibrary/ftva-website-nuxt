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
const { data, error } = await useAsyncData(`collections-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionLayoutType, { slug: route.params.slug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

// if (!data.value.ftvaCollection) {
//   throw createError({
//     statusCode: 404,
//     statusMessage: 'Page Not Found',
//     fatal: true
//   })
// }

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
  <component :is="pageType" />
</template>
<style lang="scss" scoped></style>
