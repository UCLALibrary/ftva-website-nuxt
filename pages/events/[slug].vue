<script setup>
// COMPONENTS
import { NavBreadcrumb } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import FTVAEventDetail from '../gql/queries/FTVAEventDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {
  const data = await $graphql.default.request(FTVAEventDetail, { slug: route.params.slug })
  return data
})

// const breadcrumbs = page.title
// const page = ref(_get(data.value.single, 'entry', {}))
const page = data.value.entry


// Banner Header
const imageCarousel = page.imageCarousel
const eventTitle = page.title
const cardMetaTags = page.ftvaEventFilters
const cardMetaIntro = page.ftvaEventIntroduction
const cardMetaText = page.eventDescription
// const series = data.value.series


const blockInfo = page.ftvaTicketInformation
const eventDetailDateTime = page.startDateWithTime
const eventDetailLocation = page.location

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



// const page = ref(data.value)
// watch(data, (newVal, oldVal) => {
//   console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
//   page.value = newVal
// })

</script>

<template>
  <main
    id="main"
    class="page page-event-detail"
  >


    <!-- <h5>PAGE {{ page }}</h5> -->

    <divider-way-finder />

    <h2>NavBreadcrumb</h2>
    <h3>eventTitle: {{ eventTitle }}</h3>

    <divider-way-finder />

    <h2>BannerImage(s)</h2>

    <h3>ImageCarousel</h3>
    <p>{{ imageCarousel }}</p>

    <divider-general />

    <h3>CardMeta</h3>
    <p>EventTitle: {{ eventTitle }}</p>
    <p>Tags: {{ cardMetaTags }}</p>
    <p>Intro: {{ cardMetaIntro }}</p>
    <p>Text: {{ cardMetaText }}</p>

    <divider-way-finder />

    <h3>Resgistration Info?</h3>

    <divider-way-finder />

    <h3>Screening Info?</h3>

    <divider-way-finder />

    <h3>Associated Films ? / Screening Details</h3>
    <!--
        const mockEventSeries = {
          event:{
            eventTitle: 'Origin of a Meal',
            ftvaEventIntroduction: 'In-person: chef and restaurateur Alice Waters.',
            ftvaEventFilters: [
              { title: 'Guest speaker' }, { title: '35mm' }
            ],
            text: '<p>From a meal composed of eggs, canned tuna and bananas, Luc Moullet goes up the chain that led these foods to his plate: supermarket managers, wholesalers, importers, manufacturers, workers, etc. are interviewed to help us understand how it all works.</p>',
          }
          series: {
            title: "TEST Series: The Step Up Movie Series"
          }
        }
         -->

    <divider-way-finder />

    <h2>SideBar</h2>
    <h3>BlockEventDetailDateTime</h3>
    <h4>eventDetailDateTime: {{ eventDetailDateTime }}</h4>
    <h4>eventDetailLocation: {{ eventDetailLocation }}</h4>

    <divider-general />

    <h3>InfoBlock</h3>
    <h4>blockInfo: {{ blockInfo }}</h4>

    <divider-way-finder />


    <!--
        ftvaTicketInformation: [
          {title: "Admission is free"},
          {title: "Seats are assigned on a first come, first served basis"},
          {title: "The box office opens one hour before the event"}
        ],
        ftvaEventRegistration: [
          {registrationText: "UCLA Box Office", registrationUrlLink: "https://tickets.ucla.edu/"}
        ]
        -->

    <!--
        query FTVADetail($slug: [String!]) {
          entry(section: "ftvaEvent", slug: $slug) {
            id
            typeHandle
            title
            uri
            slug
            ... on ftvaEvent_ftvaEvent_Entry {
              id
              ftvaTicketInformation {
                title
              }
              ftvaEventRegistration {
                ... on ftvaEventRegistration_eventRegistration_BlockType {
                  registrationText
                  registrationUrlLink
                }
              }
            }
          }
        }
        -->

    <div>More in this series
      <div>CardWithImage</div>
      <div>
        image
        title
        date | time
      </div>
    </div>

  </main>
</template>
