<script setup>

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

const pageId = computed(() => {
  return page.value.id
})


// const parsedFtvaEventSeries = computed(() => {
//   const events = series.value[0].ftvaEvent.slice(1)
//   return events.slice(0, 3)
//   // return series.value[0].ftvaEvent.filter(el => el.name !== "pageId")
// })

// https://www.geeksforgeeks.org/remove-array-element-based-on-object-property-in-javascript/
const parsedFtvaEventSeries = computed(() => {
  const pageId = page.value.id
  const events = series.value[0].ftvaEvent.map(item => {
    // return item.id !== pageId ? item : {}; this works  but adds an empty object
    if (item.id !== pageId && item != null) {
      return item
    }
  })

  const filtered = events.filter(function (el) {
    return el != null;
  });
  // return events.slice(0, 3)
  return filtered.slice(0, 3)
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
    <!-- <h4>pageId {{ pageId }}</h4>
    <h4>parsedFtvaEventSeries {{ parsedFtvaEventSeries }}</h4> -->

    <responsive-image :media="parsedImage[0].image[0]">
      <template v-slot:credit>
        Photo by John Doe
      </template>
    </responsive-image>
    <hr>

    <h3>FlexibleMediaGalleryNewLightbox </h3>
    <h4>parsedImage-- {{ parsedImage }}</h4>
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

    <!-- <h3>parsedFtvaEventSeries--{{ parsedFtvaEventSeries }}</h3> -->
    <SectionWrapper
      v-if="series && series.length > 0"
      section-title="Explore upcoming events in this series"
    >

      <SectionTeaserCard
        v-if="series && series.length > 0"
        :items="parsedFtvaEventSeries"
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
