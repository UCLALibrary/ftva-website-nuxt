<script setup>
// COMPONENTS
import { SectionWrapper, SectionHeader, SectionStaffArticleList, RichText, DividerWayFinder, BlockCardWithImage } from '@ucla-library-monorepo/ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'
// import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

// GQL
// import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'
import FTVAARSCIMCS from '../gql/queries/FTVAEntryARSCIMCS.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
// routes this page supports:
const routeNameToSectionMap = {
  '/archive-research-study-center': 'ftvaArchiveResearchAndStudyCenter',
  '/instructional-media-collections-services': 'ftvaInstructionalMediaCollectionsAndServices'
}
const { data, error } = await useAsyncData('page-data', async () => {
  // lookup section based on routeNameToSectionMap
  const data = await $graphql.default.request(FTVAARSCIMCS, { section: routeNameToSectionMap[route.path] })
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
// if (data.value.entry && import.meta.prerender) {
//   try {
//     // Call the composable to use the indexing function
//     const { indexContent } = useContentIndexer()
//     const doc = {
//       title: data.value.entry.title,
//       text: data.value.entry.summary,
//       uri: '/blog'
//     }
//     // Index the articles data using the composable during static build
//     await indexContent(doc, 'article-listing')
//     // console.log('Articles indexed successfully during static build')
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('FAILED TO INDEX EVENT ARTICLE LISTING during static build:', error)
//   }
// }

// DATA
const page = ref(_get(data.value, 'entry', {}))
// const pageTitle = page.value.title
// const pageSummary = page.value.summary

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
  // pageTitle.value = page.value.title
  // pageSummary.value = page.value.summary
})

// watch(
//   () => route.query,
//   (newVal, oldVal) => {
//     isLoading.value = false
//     currentPage.value = route.query.page ? parseInt(route.query.page) : 1
//     isMobile.value ? mobileArticles.value = [] : desktopArticles.value = []
//     hasMore.value = true
//     searchES()
//   }, { deep: true, immediate: true }
// )

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

definePageMeta({
  layout: 'default',
  path: '/archive-research-study-center',
  alias: ['/instructional-media-collections-services']
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
  <!-- todo write in page route.name dynamically ? need some specific class -->
  <div class="page">
    <SectionWrapper
      :section-title="page.title"
      class="header"
      data-test=""
    >
      <template v-if="showPageSummary">
        <RichText :rich-text-content="page.summary" />
      </template>
    </SectionWrapper>
    <SectionWrapper>
      {{ page }}
    </SectionWrapper>
  </div>
</template>
