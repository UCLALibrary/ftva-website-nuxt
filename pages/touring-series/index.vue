<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVATouringSeriesList from '../gql/queries/FTVATouringSeriesList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('touring-series-list', async () => {
  const data = await $graphql.default.request(FTVATouringSeriesList)
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.titleGeneral,
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.titleGeneral),
      text: data.value.entry.summary,
      uri: '/touring-series',
      sectionHandle: data.value.entry.sectionHandle,
<<<<<<< HEAD
      groupName: 'Series',
=======
      groupName: 'Touring Series',
>>>>>>> 37bc2d7 (Set up basic page template)
      postDate: data.value.entry.postDate,
    }
    // Index the Touring Series data using the composable during static build
    await indexContent(doc, 'touring-series-listing')
    // console.log('Touring Series indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX TOURING SERIES listing during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
console.log('page data: ', page.value)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

const heading = ref(_get(data.value, 'entry', {}))

useHead({
  title: heading.value ? heading.value.titleGeneral : '... Loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(heading.value.summary)
    }
  ]
})

const pageClasses = computed(() => {
  return ['page', 'page-touring-series', 'page-bottom-spacer']
})
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <SectionWrapper>
      <h1>{{ page.titleGeneral }}</h1>
      <pre style="text-wrap: auto;">{{ page }}</pre>
      <DividerGeneral />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-touring-series {}
</style>
