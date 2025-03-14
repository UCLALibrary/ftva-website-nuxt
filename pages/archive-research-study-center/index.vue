<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAARSCIMCS from '../gql/queries/FTVAEntryARSCIMCS.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
// routes this page supports:
const routeNameToSectionMap = {
  '/archive-research-study-center': 'ftvaArchiveResearchAndStudyCenter',
  '/instructional-media-collections-services': 'ftvaInstructionalMediaCollectionsAndServices'
}
const { data, error } = await useAsyncData(route.path, async () => {
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

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

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
  <!-- todo write in page route.name dynamically in class? need some specific class -->
  <main
    id="main"
    class="page"
  >
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
  </main>
</template>
