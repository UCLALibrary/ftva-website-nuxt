<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionTypeListing from '../gql/queries/FTVACollectionTypeListing.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// routes this page supports:
const routeNameToSectionMap = {
  '/collections/motion-picture': {
    sectionName: 'ftvaListingMotionPictureCollections',
    collection: 'motionPicture'
  },
  '/collections/television': {
    sectionName: 'ftvaListingTelevisionCollections',
    collection: 'television'
  },
  '/collections/watch-listen-online': {
    sectionName: 'ftvaListingWatchAndListenOnline',
    collection: 'watch-listen-online'
  }
}

const { data, error } = await useAsyncData(route.path, async () => {
  // lookup section based on routeNameToSectionMap
  const data = await $graphql.default.request(FTVACollectionTypeListing, { section: routeNameToSectionMap[route.path].sectionName, collectionType: routeNameToSectionMap[route.path].collection })
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
const collection = ref(_get(data.value, 'entries', {}))

console.log('page data: ', page.value)
console.log('collection data: ', collection.value)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  collection.value = _get(newVal, 'entries', [])
})

definePageMeta({
  layout: 'default',
  path: '/collections/motion-picture',
  alias: ['/collections/television', '/collections/watch-listen-online']
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
  <main
    id="main"
    class="page"
  >
    <SectionWrapper>
      <h1>{{ page.title }}</h1>
      <pre style="text-wrap: auto;">{{ page }}</pre>
      <DividerGeneral />
      <h2>Collection Count: {{ collection.length }}</h2>
      <p>Displaying first 10</p>
      <pre style="text-wrap: auto;">{{ collection.slice(0, 10) }}</pre>
    </SectionWrapper>
  </main>
</template>
