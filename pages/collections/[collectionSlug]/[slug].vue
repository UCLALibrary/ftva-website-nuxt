<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionItem from '../gql/queries/FTVACollectionItem.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`collection-item-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionItem, { slug: route.params.slug })
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
    await indexContent(data.value.entry, route.params.slug)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION ITEM during static build:', error)
  }
}

console.log('Data: ', data.value)

const page = ref(_get(data.value, 'entry', {}))
const relatedContent = ref(_get(data.value, 'entries', {}))

// Entries query returns 4 random articles; main article might be included in the randomized return; if so, filter out the main article and use the remaining three in the related section
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
          {{ item.title }}
        </NuxtLink>
        <br>
        <p>id: {{ item.id }}</p>
        <p>image: {{ item.ftvaImage[0].src }}</p>

        <divider-general />
      </div>
    </section-wrapper>
  </main>
</template>

<style lang="scss" scoped></style>
