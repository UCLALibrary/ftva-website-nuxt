<script setup>
// COMPONENTS
import { DividerGeneral, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
// TODO 

const { $graphql } = useNuxtApp()

// const { data, error } = await useAsyncData('collection-list', async () => {
//   const data = await $graphql.default.request(FTVACollectionList)
//   return data
// })

// if (error.value) {
//   throw createError({
//     ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
//   })
// }

// if (!data.value.entries) {
//   // console.log('no data')
//   throw createError({
//     statusCode: 404,
//     statusMessage: 'Page Not Found',
//     fatal: true
//   })
// }

// const page = ref(_get(data.value, 'entries[0]', {}))
// useHead({
//   title: page.value?.title || '... loading',
// })
</script>

<template>
  <div
    class="page page-collections"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="LA Rebellion Filmmakers">
      <h2>SEACHBAR</h2>

      <!-- <div
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
      </div> -->

      <!-- <code><strong>PAGE</strong> {{ page }}</code> -->
    </section-wrapper>
  </div>
</template>

<style scoped>
@import 'assets/styles/listing-pages.scss';
</style>
