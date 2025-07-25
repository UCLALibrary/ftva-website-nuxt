<script setup>
import { computed } from 'vue'

// HELPERS & UTILS
import _get from 'lodash/get'
import removeTags from '~/utils/removeTags'

// GQL
import FTVALARebellionFilmmakersList from '~/gql/queries/FTVALARebellionFilmmakersList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('la-rebellion-filmmakers', async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersList)
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
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()

    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: '/collections/la-rebellion/filmmakers/',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Collections',
    }

    // Index the event data using the composable during static build
    await indexContent(doc, 'filmmaker-listing')

    // console.log('Article indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX FILMMAKER LISTING during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))
console.log('page: ', page.value)

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  filmmakers.value = _get(newVal, 'entries', [])
})

const showSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
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

// TESTING COMPOSABLE
const currentPage = ref(1)
const documentsPerPage = 12
const totalDocuments = ref()
const filmmakers = ref([])
const { paginatedFilmmakersQuery } = useFilmmakersListSearch()

onMounted(async () => {
  const esOutput = await paginatedFilmmakersQuery(
    currentPage.value,
    documentsPerPage,
    'title.keyword',
    'asc'
  )

  totalDocuments.value = esOutput.hits.total.value
  filmmakers.value = esOutput.hits.hits

  console.log('ES current page hits: ', esOutput.hits.hits) // 12
  console.log('ES total hits: ', esOutput.hits.total.value) // 327
})

</script>

<template>
  <div
    class="page page-filmmakers"
    style="padding: 25px 100px;"
  >
    <SectionWrapper :section-title="page.title">
      <template v-if="showSummary">
        <RichText :rich-text-content="page.summary" />
      </template>
      <DividerWayFinder />
      <h2>Filmmaker Listing Count: {{ totalDocuments }}</h2>
      <br>
      <h3>First {{ documentsPerPage }} entries:</h3>
      <br>
      <div
        v-for="filmmaker in filmmakers"
        :key="filmmaker?._source.id"
      >
        <NuxtLink :to="`/${filmmaker?._source.to}`">
          <h3>{{ filmmaker?._source.title }}</h3>
        </NuxtLink>
        <p>{{ filmmaker?._source.richText }}</p>
        <DividerGeneral />
      </div>
    </SectionWrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
