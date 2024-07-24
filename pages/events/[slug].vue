<script setup>
// COMPONENTS
// import { SectionWrapper, DividerWayFinder, NavBreadcrumb, ResponsiveImage, FlexibleMediaGalleryNewLightbox, CardMeta, RichText, BlockInfo, SectionScreeningDetails, SectionCardWithImage } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventDetail from '../gql/queries/FTVAEventDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventDetail, { slug: route.params.slug })

  // return { data, ftvaEventSeries }
  return data
})
if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.ftvaEvent) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

const page = ref(_get(data.value, 'ftvaEvent', {}))
const series = ref(_get(data.value, 'ftvaEventSeries', {}))

watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = newVal
})

const parsedImage = computed(() => {
  return page.value.imageCarousel
})

const parsedStartDate = computed(() => {
  return page.value.startDate
})

const parsedStartTime = computed(() => {
  return page.value.startTime
})


// const parsedCardWithImage = computed(( => {

// }))

// const parsedImageCarousel = computed(() => {
//   if (page.value.endowment) {
//     return page.value.endowment.map((obj, index) => {
//       return {
//         to: `/${obj.to}`,
//         image: _get(obj, 'image[0].image[0]', null),
//         title: _get(obj, 'title', ''),
//         description: _get(obj, 'description', ''),
//         category:
//           obj.donors.length > 0 ? parsedDonors(obj) : '',
//       }
//     })
//   } else {
//     return ''
//   }
// })

// const parsedServicesAndResources = computed(() => {
//   const services = page.value.resourceServiceWorkshop
//   return services.map((obj) => {
//     return {
//       ...obj,
//       to: obj.externalResourceUrl
//         ? obj.externalResourceUrl
//         : `/${obj.to}`,
//       title: _get(obj, 'title', ''),
//       text: _get(obj, 'text', ''),
//     }
//   })
// })
</script>

<template>
  <main
    id="main"
    class="page page-event-detail"
  >
    <NavBreadcrumb
      v-if="page.title"
      :title="page.title"
      class="breadcrumb"
      to="/events"
      parent-title="All Events"
    />

    <h4>{{ parsedImage }}</h4>
    <h3>ResponsiveImage 1</h3>
    <ResponsiveImage
      :media="parsedImage[0].media[0]"
      class="responsive-image"
    />


    <h3>ResponsiveImage 2</h3>
    <responsive-image :media="parsedImage[0].media[0]">
      <template v-slot:credit>
        Photo by John Doe
      </template>
    </responsive-image>
    <hr>

    <FlexibleMediaGalleryNewLightbox :items="parsedImage" />

    <SectionWrapper>
      <CardMeta
        :category="series[0].title"
        :title="page.title"
        :tag-labels="page.ftvaEventFilters"
        :introduction="page.ftvaEventIntroduction"
        :text="page.eventDescription"
      />
      <RichText
        v-if="page.guestSpeaker"
        :rich-text-content="page.guestSpeaker"
      />

      <RichText
        v-if="page.acknowledements"
        :rich-text-content="page.acknowledements"
      />
    </SectionWrapper>

    <SectionWrapper>
      <DividerWayFinder />
    </SectionWrapper>

    <SectionWrapper>
      <SectionScreeningDetails :items="page.ftvaEventScreeningDetails" />
    </SectionWrapper>

    <SectionWrapper
      v-if="series && series.length > 0"
      section-title="Explore upcoming events in this series"
    >
      <h3>CardWithImage</h3>
      <code v-if="series[0].ftvaEvent"> series.ftvaEvent:: {{ series[0].ftvaEvent }} </code>

      <SectionCardWithImage
        v-if="series && series.length > 0"
        :items="series[0].ftvaEvent"
      />
    </SectionWrapper>

    <SectionWrapper section-title="SIDEBAR">
      <BlockEventDetail
        :startDate="page.startDateWithTime"
        :time="page.startDateWithTime"
        :locations="page.location"
      />

      <BlockInfo :ftva-ticket-information="page.ftvaTicketInformation" />
    </SectionWrapper>
  </main>
</template>
