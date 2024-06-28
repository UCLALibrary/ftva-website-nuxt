<script setup>
// HELPERS
import _get from 'lodash/get'

// GQL
import EVENT_DETAIL from '../gql/queries/EventDetail.gql'

const { $graphql } = useNuxtApp()

const route = useRoute()

// DATA
const { data, error } = await useAsyncData(`events-detail-${route.params.slug}`, async () => {

  console.log('PUPPY')

  try {
    const data = await $graphql.default.request(EVENT_DETAIL, { slug: route.params.slug })
  } catch (error) {
    console.error(error)
  }

  console.log('test:', data)

  return data
})

console.log('DATA.VALUE', data.value)

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
    <h2>PAGE{{ data }}</h2>
    <div>Breadcrumb</div>
    <div>BannerHeaderText</div>
    <div>ResponsiveImage</div>
    <div>ImageCarousel</div>
    <div>CardMeta</div>
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

    <divider-way-finder color="visit" />

    <div>EventDetails</div>

    <div>SideBar</div>
    <div>
      <div>Date</div>
      <div>Time</div>
      <div>Location</div>
    </div>
    <div>InfoBlock</div>
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
