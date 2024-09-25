<script setup>
// COMPONENTS
import { SectionWrapper } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAArticleList from '../gql/queries/FTVAArticleList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('article-list', async () => {
  const data = await $graphql.default.request(FTVAArticleList)
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

const page = ref(_get(data.value, 'entries', {}))

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
      <div
        v-for="article in data.entries"
        :key="article?.id"
      >
        <NuxtLink :to="`/${article?.to}`">
          {{ article?.title }}
        </NuxtLink>

        <divider-general />
      </div>

      <h3>PAGE DATA</h3>
      <pre> {{ page }}</pre>
    </section-wrapper>
  </div>
</template>

<style scoped>
.page-article-list {
  a {
    outline-color: transparent;
    font-size: 24px;
  }

  a:link {
    color: #ca05ca;
  }

  a:visited {
    color: #eb087a;
  }

  a:focus {
    text-decoration: none;
    background: #03c2dc;
  }

  a:hover {
    text-decoration: none;
    background: #07eef6;
  }

  a:active {
    background: #6900ff;
    color: #cdfeaa;
  }
}
</style>
