<script setup>
// COMPONENTS
import { DividerGeneral, SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('article-list', async () => {
  const data = await $graphql.default.request(FTVAArticleList.gql)
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

const page = ref(_get(data.value, 'entries[0]', {}))

// const recent = ref(_get(data.value, 'entries[0]', {}))

// const people = ref(_get(data.value, 'entries[0]', {}))

// const interviews = ref(_get(data.value, 'entries[0]', {}))

// const preservation_restoration = ref(_get(data.value, 'entries[0]', {}))
</script>

<template>
  <div
    class="page page-article-list"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="Recent">

      <!-- <div
        v-for="event in data.entries"
        :key="event?.id"
      >
        <NuxtLink :to="`/${event?.to}`">
          {{ event?.title }}
        </NuxtLink> <br>
        <h4>startDate: <code>{{ event?.startDate }}</code></h4>
        <h4>startTime: <code>{{ event?.startTime }}</code></h4>
        <h4>ftvaEventFilters: <code>{{ event?.ftvaEventFilters }}</code></h4>
        <h4>image: <code>{{ event?.image }}</code></h4>
        <divider-general />
      </div> -->

      <code><strong>PAGE</strong> {{ page }}</code>
    </section-wrapper>
  </div>
</template>

<style scoped>
.page-article-list {}
</style>
