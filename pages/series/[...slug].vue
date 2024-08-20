<script setup>
// COMPONENT RE-IMPORTS
// TODO: remove when we have implemented component library as a module
// https://nuxt.com/docs/guide/directory-structure/components#library-authors

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventSeriesDetail from '../gql/queries/FTVAEventSeriesDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`ftva-event-series-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventSeriesDetail, { slug: route.params.slug })
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found WEIRDO.' + error.value, fatal: true
  })
}

if (!data.value.ftvaEventSeries) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found JEN JEN',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(data.value, 'ftvaEventSeries', {})
})
</script>

<template>
  <main
    id="main"
    class="page page-ftva-event-series-detail"
  >
    HELLO ISABEL

    <h3>{{ page }}</h3>
  </main>
</template>

<style
  lang="scss"
  scoped
></style>
