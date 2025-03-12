<script setup>
// COMPONENTS
import { BlockInfo, DividerWayFinder, ResponsiveImage, RichText, SectionHeader, SectionWrapper } from '@ucla-library-monorepo/ucla-library-website-components'

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

const parsedImage = computed(() => {
  // fail gracefully if data does not exist (server-side)
  if (!page.value.image) {
    return []
  }
  return page.value.image
})
// console.log('image: ', parsedImage.value)

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
    class="page page-detail page-detail--paleblue page-billy-wilder-theater"
  >
    <div class="one-column">
      <!-- <SectionWrapper theme="paleblue"> -->
      <!-- <div class="one-column"> -->
      <ResponsiveImage
        v-if="parsedImage.length === 1"
        :media="parsedImage[0]"
        :aspect-ratio="43.103"
      />
      <!-- </div> -->
      <!-- </SectionWrapper> -->
    </div>
    <SectionWrapper>
      <SectionHeader
        :level="1"
        class="page-heading"
      >
        {{ page.title }}
      </SectionHeader>

      <DividerWayFinder />

      <SectionHeader
        :level="3"
        class="section-headings"
      >
        {{ page.ftvaAdmissions[0].sectionTitle }}
      </SectionHeader>

      <BlockInfo
        color-scheme="paleblue"
        class="block-info--blue"
      >
        <template #block-info-top>
          <RichText :rich-text-content="page.ftvaAdmissions[1].richText" />
        </template>
      </BlockInfo>

      <div class="block-info--flex">
        <BlockInfo
          v-for="item, index in page.ftvaAdmissions[2].admissionsHeadingAndTextBlock"
          :key="index"
          color-scheme="paleblue"
        >
          <template #block-info-top>
            <RichText :rich-text-content="item.title" />
          </template>
          <template #block-info-mid>
            <RichText :rich-text-content="item.text" />
          </template>
        </BlockInfo>
      </div>

      <DividerWayFinder />

      <SectionHeader
        :level="3"
        class="section-headings"
      >
        Parking and Directions
      </SectionHeader>

      <DividerWayFinder />

      <SectionHeader
        :level="3"
        class="section-headings"
      >
        About the Billy Wilder Theater
      </SectionHeader>

      <RichText :rich-text-content="page.richText" />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-billy-wilder-theater {
  .one-column {
    padding-top: 80px;
  }

  .page-heading {
    @include ftva-h2;
    color: $heading-grey;
  }

  .section-headings {
    @include ftva-h4;
    color: $heading-grey;
    margin-bottom: 20px;
  }

  .block-info--blue {
    padding: 32px 32px 0 32px;
    margin-bottom: 60px;
  }

  .block-info--flex {
    display: flex;
    justify-content: space-evenly;
    gap: 60px;

    >* {
      flex: 1;
      padding: 0;
    }

    :deep(.parsed-content) {
      margin-bottom: 0;
    }
  }

  .rich-text {
    padding-right: 0;
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
