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
    collection: 'watchAndListenOnline'
  }
}

const { data, error } = await useAsyncData(route.path, async () => {
  // lookup section based on routeNameToSectionMap
  const data = await $graphql.default.request(FTVACollectionTypeListing, { section: routeNameToSectionMap[route.path].sectionName })
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
console.log('Page data: ', page.value)

// TESTING ES
const collectionType = ref(routeNameToSectionMap[route.path].collection)
const currentPage = ref(1)
const documentsPerPage = 10

const { paginatedCollectionListQuery } = useCollectionListSearch()

onMounted(async () => {
  const esOutput = await paginatedCollectionListQuery(
    collectionType.value,
    currentPage.value,
    documentsPerPage,
  )

  console.log('ES output total hits: ', esOutput.hits.total.value)

  // Motion Picture route ==> 48
  // Television route ==> 26
  // Watch and Listen Online ==> 6
})

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
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
      <h2>Collection Count: ?</h2>
      <p>Displaying first 10</p>
      <!--<pre style="text-wrap: auto;">{{ xxx.slice(0, 10) }}</pre>-->
    </SectionWrapper>
  </main>
</template>
