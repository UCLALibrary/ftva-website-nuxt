<script setup>
// COMPONENTS
// import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'

const { $graphql } = useNuxtApp()

// const route = useRoute()

const { data, error } = await useAsyncData('article-list', async () => {
  const data = await $graphql.default.request(FTVAArticleList) // ???
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      text: data.value.entry.summary,
      uri: '/blog'
    }
    // Index the articles data using the composable during static build
    await indexContent(doc, 'billy-wilder-theater')
    // console.log('Articles indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX EVENT ARTICLE LISTING during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const pageTitle = page.value.title
const pageSummary = page.value.summary
const featuredArticles = page.value.ftvaFeaturedArticles

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  pageTitle.value = page.value.title
  pageSummary.value = page.value.summary
  featuredArticles.value = page.value.ftvaFeaturedArticles
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
  <div class="">
    <h2>Billy Wilder Theater</h2>
  </div>
</template>

<style lang="scss" scoped></style>
