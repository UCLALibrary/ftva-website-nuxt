<script setup>
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

// METADATA INFO
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    const doc = {
      title: data.value.entry.title,
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.title),
      text: data.value.entry.summary,
      uri: '/billy-wilder-theater',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'General Content',
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
  if (!page.value.image) {
    return []
  }
  return page.value.image
})

const parsedAdmissions = computed(() => {
  const data = page.value.ftvaAdmissions
  const admissions = {
    title: data[0]?.sectionTitle || '',
    description: data[1]?.text || '',
    blocks: data[2]?.admissionsHeadingAndTextBlock || []
  }
  return admissions
})

const parsedParking = computed(() => {
  const data = page.value.ftvaParkingAndDirections

  const regex = /<iframe[^>]*\s+src="([^"]*)"/
  const address = data[1]?.ftvaGoogleMapsEmbed[0] || {}
  const mapEmbedSrc = address.googleMapsEmbed ? address.googleMapsEmbed.match(regex) : null

  const parking = {
    title: data[0]?.sectionTitle || '',
    address,
    map: mapEmbedSrc ? mapEmbedSrc[1] : '',
    blocks: data[2]?.parkingDirectionsHeadingAndTextBlock || []
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
    class="page page-detail page-detail--paleblue billy-wilder-theater"
  >
    <div class="one-column">
      <ResponsiveImage
        v-if="parsedImage.length === 1"
        :media="parsedImage[0]"
        :aspect-ratio="43.103"
        data-test="hero-image"
      />
    </div>
    <SectionWrapper>
      <SectionHeader
        :level="1"
        class="page-heading"
        data-test="page-heading"
      >
        {{ page.title }}
      </SectionHeader>

      <DividerWayFinder />

      <SectionHeader
        v-if="parsedAdmissions.title"
        :level="2"
        class="section-heading"
      >
        {{ parsedAdmissions.title }}
      </SectionHeader>

      <BlockInfo
        v-if="parsedAdmissions.description"
        color-scheme="paleblue"
      >
        <template #block-info-top>
          <RichText
            :rich-text-content="parsedAdmissions.description"
            data-test="admissions-intro"
          />
        </template>
      </BlockInfo>

      <div class="block-info-wrapper--flex admissions">
        <BlockInfo
          v-for="block in parsedAdmissions?.blocks"
          :key="block.title"
        >
          <template #block-info-top>
            <SectionHeader
              :level="3"
              class="section-subtitle"
            >
              {{ block.title }}
            </SectionHeader>
          </template>
          <template #block-info-mid>
            <RichText
              :rich-text-content="block.text"
              data-test="admissions-info"
            />
          </template>
        </BlockInfo>
      </div>

      <DividerWayFinder />

      <SectionHeader
        :level="2"
        class="section-heading"
      >
        {{ parsedParking.title }}
      </SectionHeader>

      <div class="block-info-wrapper--flex directions">
        <BlockInfo
          color-scheme="paleblue"
          class="address"
          data-test="theater-address"
        >
          <template #block-info-top>
            <p class="map-title">
              {{ parsedParking?.address?.locationName }}
            </p>
            <p class="map-note">
              {{ parsedParking.address.locationNotes }}
            </p>
          </template>

          <template #block-info-end>
            <p class="map-address">
              {{ parsedParking.address.addressLine1 }}
            </p>
            <p class="map-address">
              {{ parsedParking.address.addressLine2 }}
            </p>
          </template>
        </BlockInfo>
        <div class="iframe-wrapper">
          <iframe
            :src="parsedParking.map"
            title="Billy Wilder Theater directions"
            class="iframe"
            width="100%"
            height="100%"
            allowfullscreen
            data-test="theater-map"
          />
        </div>
      </div>

      <div class="block-info-wrapper--flex parking">
        <BlockInfo
          v-for="block in parsedParking.blocks"
          :key="block.title"
          class="parking-topic"
        >
          <template #block-info-top>
            <SectionHeader
              :level="3"
              class="section-subtitle"
            >
              {{ block.title }}
            </SectionHeader>
          </template>
          <template #block-info-mid>
            <RichText
              :rich-text-content="block.text"
              data-test="parking-info"
            />
          </template>
        </BlockInfo>
      </div>

      <DividerWayFinder />

      <SectionHeader
        :level="2"
        class="section-heading"
      >
        {{ page.sectionTitle }}
      </SectionHeader>

      <RichText
        :rich-text-content="page.description"
        data-test="page-description"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.billy-wilder-theater {
  padding-bottom: 120px; // Footer spacing

  .one-column {
    padding-top: 80px;
  }

  .section-wrapper.section-wrapper2 {
    margin-bottom: 0;
  }

  .page-heading {
    @include ftva-h2;
  }

  .section-heading {
    @include ftva-h4;
    margin-bottom: 20px;
  }

  .section-subtitle {
    @include ftva-emphasized-subtitle;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .block-info.paleblue {
    padding: 36px 36px 6px 36px;
    margin-bottom: 60px;
  }

  .block-info-wrapper--flex {
    display: flex;
    flex-wrap: wrap;

    >* {
      padding: 0;
    }

    :deep(.rich-text) {

      // UPDATED FOOTER
      .parsed-content {
        // margin-bottom: 0;

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

    &.directions {
      border-radius: 10px;
      margin-bottom: 60px;
      overflow: hidden;

      .block-info.paleblue {
        padding: 40px 0 36px 36px;
        justify-content: space-between;
        margin-bottom: 0;
        border-radius: 0;
      }

      .address {
        flex-basis: 40%;
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

  .map-title {
    @include ftva-h5;
  }

  .map-note {
    font-size: 16px;
    text-transform: uppercase;
  }

  .map-address {
    @include ftva-emphasized-subtitle;
    color: $accent-blue;
  }

  .iframe-wrapper {
    position: relative;
    min-height: 400px;
    flex-basis: 60%;
  }

  .iframe {
    border: 0;
    height: 100%;
    width: 100%;
    left: 0;
    top: 0;
    position: absolute;
    z-index: 10;
  }

  .rich-text {
    padding-right: 0;

    :deep(.parsed-content) {
      margin-bottom: 0;
    }
  }

  .page-heading,
  .section-heading,
  .section-subtitle,
  .map-title,
  .map-note {
    color: $heading-grey;
  }

  @media #{$medium} {
    .one-column {
      padding-top: 60px;
    }

    .block-info-wrapper--flex {

      &.admissions,
      &.parking {
        gap: 20px 0;
      }

      &.admissions,
      &.directions {
        flex-direction: column;
      }

      &.directions {
        margin-bottom: 32px;

        .block-info.paleblue {
          padding: 20px;
        }

        .address {
          row-gap: 32px;
          flex-basis: 100%;
        }

        .iframe-wrapper {
          flex-basis: 100%;
          min-height: 350px;
        }
      }

      &.parking {

        .parking-topic:nth-of-type(3),
        .parking-topic:nth-of-type(4) {
          flex-basis: 100%;
        }
      }
    }
  }

  @media #{$small} {
    padding-bottom: 86px; // Footer spacing
  }
}
</style>
