<script setup>
// COMPONENTS
import { SectionWrapper, DividerGeneral } from '@ucla-library-monorepo/ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import BillyWilderTheater from '../gql/queries/BillyWilderTheater.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('billy-wilder-theater', async () => {
  const data = await $graphql.default.request(BillyWilderTheater)
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

console.log('Data: ', data.value)

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.titleGeneral,
      text: data.value.entry.summary,
    }
    // Index the data using the composable during static build
    await indexContent(doc, 'billy-wilder-theater')
    // console.log('Billy Wilder Theater content indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX BILLY WILDER THEATER CONTENT during static build:', error)
  }
}

// DATA
const page = ref(_get(data.value, 'entry', {}))

// PREVIEW WATCHER FOR CRAFT CONTENT
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
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
    class="page page-billy-wilder-theater"
    style="padding: 25px 100px;"
  >
    <SectionWrapper>
      <h2>Plan Your Visit</h2>
      <pre style="text-wrap: auto;">{{ page }}</pre>
      <divider-general />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped></style>
