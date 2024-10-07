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

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'entries[0]', {}))
// TODO page metadata title
useHead({
  title: page.value?.title || '... loading',
  // meta: [
  //   {
  //     hid: 'description',
  //     name: 'description',
  //     content: 'The UCLA Library creates a vibrant nexus of ideas, collections, expertise, and spaces in which users illuminate solutions for local and global challenges. We constantly evolve to advance UCLA’s research, education, and public service mission by empowering and inspiring communities of scholars and learners to discover, access, create, share, and preserve knowledge.',
  //   },
  // ],
})
</script>

<template>
  <div
    class="page page-collections"
    style="padding: 25px 100px;"
  >
    <section-wrapper section-title="Collections">
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

      <code><strong>PAGE</strong> {{ page }}</code>
    </section-wrapper>
  </div>
</template>

<style scoped>
/* TODO move to style file if we are duplicating these styles? */
.page-collections {
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
