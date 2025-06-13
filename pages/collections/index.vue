<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionList from '../gql/queries/FTVACollectionList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('collection-list', async () => {
  const data = await $graphql.default.request(FTVACollectionList)
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
// TODO This is creating an index of the content for ES search

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: '/collections',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Collections',
    }
    // Index the articles data using the composable during static build
    await indexContent(doc, 'explore-collections')
    // console.log('Explore Collections content indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO EXPLORE COLLECTIONS LISTING during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
console.log('page data: ', page.value)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
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
    </SectionWrapper>
  </main>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
