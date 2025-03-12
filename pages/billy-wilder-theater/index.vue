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

const parsedAdmissions = computed(() => {
  const data = page.value.ftvaAdmissions
  const admissions = {
    title: data[0].sectionTitle,
    description: data[1].text,
    blocks: data[2].admissionsHeadingAndTextBlock
  }
  return admissions
})

const parsedParking = computed(() => {
  const data = page.value.ftvaParkingAndDirections
  const parking = {
    title: data[0].sectionTitle,
    map: data[1].ftvaGoogleMapsEmbed[0],
    blocks: data[2].parkingDirectionsHeadingAndTextBlock
  }
  return parking
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
    class="page page-detail page-detail--paleblue page-billy-wilder-theater"
  >
    <div class="one-column">
      <ResponsiveImage
        v-if="parsedImage.length === 1"
        :media="parsedImage[0]"
        :aspect-ratio="43.103"
      />
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
        class="section-heading"
      >
        {{ parsedAdmissions.title }}
      </SectionHeader>

      <BlockInfo
        color-scheme="paleblue"
        class="block-info--paleblue"
      >
        <template #block-info-top>
          <RichText :rich-text-content="parsedAdmissions.description" />
        </template>
      </BlockInfo>

      <div class="block-info--flex admissions">
        <BlockInfo
          v-for="block in parsedAdmissions.blocks"
          :key="block.title"
        >
          <template #block-info-top>
            <SectionHeader
              :level="4"
              class="section-subtitle"
            >
              {{ block.title }}
            </SectionHeader>
          </template>
          <template #block-info-mid>
            <RichText :rich-text-content="block.text" />
          </template>
        </BlockInfo>
      </div>

      <DividerWayFinder />

      <SectionHeader
        :level="3"
        class="section-heading"
      >
        {{ parsedParking.title }}
      </SectionHeader>

      <div class="block-info--flex parking">
        <BlockInfo
          v-for="block in parsedParking.blocks"
          :key="block.title"
          class="parking-topic"
        >
          <template #block-info-top>
            <SectionHeader
              :level="4"
              class="section-subtitle"
            >
              {{ block.title }}
            </SectionHeader>
          </template>
          <template #block-info-mid>
            <RichText :rich-text-content="block.text" />
          </template>
        </BlockInfo>
      </div>

      <DividerWayFinder />

      <SectionHeader
        :level="3"
        class="section-heading"
      >
        {{ page.sectionTitle }}
      </SectionHeader>

      <RichText :rich-text-content="page.description" />
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

  .section-heading {
    @include ftva-h4;
    color: $heading-grey;
    margin-bottom: 20px;
  }

  .section-subtitle {
    @include ftva-emphasized-subtitle;
    font-size: 28px;
    color: $heading-grey;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .block-info--paleblue {
    padding: 36px 36px 6px 36px;
    margin-bottom: 60px;
  }

  .block-info--flex {
    display: flex;
    flex-wrap: wrap;

    >* {
      padding: 0;
    }

    :deep(.rich-text) {

      .parsed-content {
        margin-bottom: 0;

        p {
          margin-bottom: 12px;
        }

        ul,
        li {
          margin: 0
        }

        li:last-of-type {
          margin-bottom: 16px;
        }

        ul {
          list-style: disc;
          list-style-position: inside;
        }

        li::before {
          display: none;
        }
      }
    }

    &.admissions {
      justify-content: space-evenly;
      gap: 0 60px;

      >* {
        flex: 1;
      }
    }

    &.parking {
      justify-content: space-between;
      gap: 40px 80px;

      .parking-topic:nth-of-type(3),
      .parking-topic:nth-of-type(4) {
        flex-basis: 45%;
      }
    }
  }

  .rich-text {
    padding-right: 0;
  }

  @media #{$medium} {
    .block-info--flex {

      &.admissions,
      &.parking {
        gap: 20px 0;
      }

      &.admissions {
        flex-direction: column;
      }

      &.parking {

        .parking-topic:nth-of-type(3),
        .parking-topic:nth-of-type(4) {
          flex-basis: 100%;
        }
      }
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
