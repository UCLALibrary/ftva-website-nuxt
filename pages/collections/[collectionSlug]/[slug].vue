<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionItem from '../gql/queries/FTVACollectionItem.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

const { collectionSlug, slug } = route.params

// DATA
const { data, error } = await useAsyncData(`collection-item-${slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionItem, { slug, collectionSlug })
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

// This is creating an index of the main content (not related content)
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the data using the composable during static build
    await indexContent(data.value.entry, slug)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION ITEM during static build:', error)
  }
}

console.log('Data: ', data.value)

const page = ref(_get(data.value, 'entry', {}))
const relatedContent = ref(_get(data.value, 'entries', {}))

// Entries query returns 4 random articles; main article might be included in the randomized return; to prevent duplication, filter out the main article; use remaining content in the related section.
const parsedRelatedContent = computed(() => {
  const mainContentId = page.value.id

  const filteredRelatedContent = relatedContent.value.filter(obj => obj.id !== mainContentId)

  return filteredRelatedContent.slice(0, 3)
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
    class="page page-collection-item-detail"
    style="padding: 25px 100px;"
  >
    <section-wrapper>
      <h2>Collection Item</h2>
      <pre>{{ page }}</pre>
      <divider-general />
      <h2>Related Content</h2>
      <div
        v-for="item in parsedRelatedContent"
        :key="item.id"
      >
        <NuxtLink :to="`/${item.uri}`">
          <h4>Title-Link: {{ item.title }}</h4>
        </NuxtLink>
        <p>uri: {{ item.uri }}</p>
        <p>id: {{ item.id }}</p>
        <p>image: {{ item.ftvaImage[0] }}</p>
        <divider-general />
      </div>
    </section-wrapper>
  </main>
</template>

<style lang="scss" scoped></style>
