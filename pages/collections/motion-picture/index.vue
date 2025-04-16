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
const collectionList = ref([])
const currentPage = ref(1)
const documentsPerPage = 12
const totalDocuments = ref()
const extraFilters = ref('*')
const alphabet = ref()

onMounted(() => {
  testES()
})

async function testES() {
  const { paginatedCollectionListQuery } = useCollectionListSearch()
  const esOutput = await paginatedCollectionListQuery(
    collectionType.value,
    currentPage.value,
    documentsPerPage,
    extraFilters.value
  )

  console.log('ES search: ', extraFilters.value)
  collectionList.value = esOutput.hits.hits
  totalDocuments.value = esOutput.hits.total.value
}

watch(alphabet, (newVal, oldVal) => {
  extraFilters.value = `${newVal.toUpperCase()}*`
  testES()
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
      <h2>Collection Count (ES): {{ totalDocuments }}</h2>
      <h3>Test Browse By Alphabet</h3>
      <input
        v-model="alphabet"
        type="text"
        placeholder="Enter a single alphabet"
      >
      <p>Return 12 per page</p>
      <pre style="text-wrap: auto;">{{ collectionList }}</pre>
    </SectionWrapper>
  </main>
</template>
