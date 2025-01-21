<script setup>
// COMPONENTS
import { DividerGeneral, SectionWrapper, RichText } from 'ucla-library-website-components'
import { computed } from 'vue'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVALARebellionFilmmakersList from '~/gql/queries/FTVALARebellionFilmmakersList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('la-rebellion-filmmakers', async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersList)
  console.log('data', data)
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

const page = ref(_get(data.value, 'entry', {}))

const showSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})
useHead({
  title: page.value?.title || '... loading',
})
</script>

<template>
  <div
    class="page page-filmmakers"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="LA Rebellion Filmmakers">
      <template v-if="showSummary">
        <RichText :rich-text-content="page.summary" />
      </template>
      <div
        v-for="filmmaker in data.entries"
        :key="filmmaker?.id"
      >
        <NuxtLink :to="`${filmmaker?.to}`">
          {{ filmmaker?.title }}
        </NuxtLink> <br>
        <h4>to: <code>{{ filmmaker?.to }}</code></h4>
        <h4>richText: <code>{{ filmmaker?.richText }}</code></h4>
        <h4>associatedFilms: <code>{{ filmmaker?.associatedFilms }}</code></h4>
        <divider-general />
      </div>

      <code><strong>PAGE</strong> {{ page }}</code>
    </section-wrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
