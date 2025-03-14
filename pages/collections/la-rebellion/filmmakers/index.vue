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
  // console.log('data', data)
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

// TODO This is creating an index of the content for ES search
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the event data using the composable during static build
    await indexContent(data.value.entry, route.params.slug)

    // TODO index entries as well?
    // await indexContent(data.value.entries, route.params.slug)

    // console.log('Article indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX ARTICLES during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))
const filmmakers = ref(_get(data.value, 'entries', []))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  filmmakers.value = _get(newVal, 'entries', [])
})

const showSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})
useHead({
  title: page.value?.title || '... loading',
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
    class="page page-filmmakers"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="LA Rebellion Filmmakers">
      <template v-if="showSummary">
        <RichText :rich-text-content="page.summary" />
      </template>
      <div
        v-for="filmmaker in filmmakers"
        :key="filmmaker?.id"
      >
        <NuxtLink :to="`/${filmmaker?.to}`">
          {{ filmmaker?.title }}
        </NuxtLink> <br>
        <h4>to: <code>{{ filmmaker?.to }}</code></h4>
        <h4>richText: <code>{{ filmmaker?.richText }}</code></h4>
        <h4>associatedFilms: <code>{{ filmmaker?.associatedFilms }}</code></h4>
        <divider-general />
      </div>
    </section-wrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
