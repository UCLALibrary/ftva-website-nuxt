<script setup>
// COMPONENTS
import { DividerGeneral, SectionWrapper } from 'ucla-library-website-components'

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

if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entries.titleGeneral,
      uri: '/collections'
    }
    // Index the collections data using the composable during static build
    await indexContent(doc, 'collection-listing')
    // console.log('Collections indexed successfully during static build')
  } catch (error) {
    console.error('FAILED TO INDEX COLLECTION listing during static build:', error)
  }
}

const heading = ref(_get(data.value, 'entry', {}))

useHead({
  title: heading.value ? heading.value.titleGeneral : '... Loading'
})

// PREVIEW WATCHER
watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  heading.value = _get(newVal, 'entry', {})
})

const page = ref(_get(data.value, 'entries[0]', {}))
</script>

<template>
  <div
    class="page page-collections"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="Collections">
      <h1>HEADING {{ data }}</h1>
      <h2>SEACHBAR</h2>

      <div
        v-for="collection in data.entries"
        :key="collection?.id"
      >
        <NuxtLink :to="`/${collection?.to}`">
          {{ collection?.title }}
        </NuxtLink> <br>
        <h4>ftvaCollectionType: <code>{{ collection?.ftvaCollectionType }}</code></h4>
        <h4>richText: <code>{{ collection?.richText }}</code></h4>
        <h4>videoEmbed: <code>{{ collection?.videoEmbed }}</code></h4>
        <h4>viewAllSectionLink: <code>{{ collection?.viewAllSectionLink }}</code></h4>
        <h4>infoBlock: <code>{{ collection?.infoBlock }}</code></h4>
        <h4>image: <code>{{ collection?.image }}</code></h4>
        <divider-general />
      </div>

      <!-- <code><strong>PAGE</strong> {{ page }}</code> -->
    </section-wrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
