<script setup>
// COMPONENTS
import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('article-list', async () => {
  const data = await $graphql.default.request(FTVAArticleList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the content for ES search
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    await indexContent(data.value.entry, route.params.slug)
    // console.log('Article indexed successfully during static build')
  } catch (error) {
    console.error('FAILED TO INDEX ARTICLES during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))
const featuredArticles = page.value.ftvaFeaturedArticles
const articleList = ref(_get(data.value, 'entries', {}))
console.log('Data: ', data.value)

const currentPage = ref(1)
const documentsPerPage = 10

// TEST
const { paginatedArticlesQuery } = useArticlesListSearch()

onMounted(async () => {
  const esOutput = await paginatedArticlesQuery(
    currentPage.value,
    documentsPerPage,
    'postDate',
    'asc'
  )

  console.log('ES output total hits: ', esOutput.hits.total.value) // 445
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
  <div
    class="page page-article-list"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="Archive Blog">
      <!--<div
        v-for="article in data.entries"
        :key="article?.id"
      >
        <NuxtLink :to="`/blog/${article?.to}`">
          {{ article?.title }}
        </NuxtLink>

        <divider-general />
      </div>-->

      <h3>Featured Articles</h3>
      <pre>{{ featuredArticles }}</pre>

      <divider-general />

      <h3>Article List (Truncated)</h3>
      <pre> {{ articleList.slice(0, 15) }}</pre>
    </section-wrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
