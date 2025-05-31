<script setup>

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionStory from '../gql/queries/FTVACollectionStory.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()
console.log('route path: ', route.path)

// routes this template/page supports:
const routeNameToSlugMap = {
  '/collections/la-rebellion': 'la-rebellion',
  '/collections/in-the-life': 'in-the-life'
}

console.log('slug: ', routeNameToSlugMap[route.path])

const { data, error } = await useAsyncData(`collections-story-${route.path}`, async () => {
  // lookup slug based on routeNameToSlugMap
  const data = await $graphql.default.request(FTVACollectionStory, { slug: routeNameToSlugMap[route.path] })
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

// TODO This is creating an index of the content for ES search

// DATA
const page = ref(_get(data.value, 'entry', {}))

console.log('page data: ', page.value)

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  page.value = _get(newVal, 'entry', {})
})

definePageMeta({
  layout: 'default',
  path: '/collections/la-rebellion',
  alias: ['/collections/in-the-life']
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
    </SectionWrapper>
  </main>
</template>
