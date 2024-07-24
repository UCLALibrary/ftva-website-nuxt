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

// const parsedImage = computed(() => {
//   return page.image
// })

// const parsedCardWithImage = computed(( => {

//}))


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

    <h4>{{ page.imageCarousel.length > 1 }}</h4>
    <h4>{{ page.imageCarousel }}</h4>
    <!-- <h4>{{ page }}</h4>
    <hr>
    <h4>SERIES.FTVAEVENT:: {{ series[0].ftvaEvent }}</h4> -->
    <hr>
    <h3>page.imageCarousel[0]JEN::: {{ page.imageCarousel }}</h3>
    <hr>
    <h3>imageCarousel responsiveImage{{ page.imageCarousel[0].image[0] }}</h3>
    <h3>HELLO</h3>
    <ResponsiveImage
      :media="page.imageCarousel[0].image[0]"
      class="responsive-image"
    />

    <FlexibleMediaGalleryNewLightbox :items="page.imageCarousel" />

    <SectionWrapper>
      <CardMeta
        :category="series[0].title"
        :title="page.title"
        :tagLabels="page.ftvaEventFilters"
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
    <h3>{{ page.ftvaEventScreeningDetails }}</h3>
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
      <h3>BLOCK EVENT DETAIL</h3>
      <!-- <div>
        <h4 v-if="page.startDate">
          Date: {{ page.startDate }}
        </h4>
        <h4 v-if="page.startTime">
          Time: {{ page.startTime }}
        </h4>
        <h4 v-if="page.location">
          Location: {{ page.location }}
        </h4>
      </div> -->
      <!--
      <BlockEventDetail
        :startDate="page.startDate"
        :time="page.startTime"
        :locations="page.location"
      /> -->

      <BlockInfo :ftvaTicketInformation="page.ftvaTicketInformation" />

    </SectionWrapper>

  </main>
</template>
