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

// const breadcrumbs = page.title
// const page = ref(_get(data.value.single, 'entry', {}))
const page = data.value.ftvaEvent

// Banner Header
const imageCarousel = page.imageCarousel
const eventTitle = page.title
// CardMeta
const cardMetaTags = page.ftvaEventFilters
const cardMetaIntro = page.ftvaEventIntroduction
const cardMetaText = page.eventDescription
const series = data.value.ftvaEventSeries
// BlockScreening
const screeningDetails = page.ftvaEventScreeningDetails
// Sidebar
const blockInfo = page.ftvaTicketInformation
const eventDetailDateTime = page.startDateWithTime
const eventDetailLocation = page.location

// const page = ref(data.value)
watch(data, (newVal, oldVal) => {
  console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = newVal
})

</script>

<template>
  <main
    id="main"
    class="page page-event-detail"
  >

    <h2>NavBreadcrumb</h2>

    <NavBreadcrumb
      v-if="page"
      :title="page.title"
      class="breadcrumb"
      to="/events"
      parent-title="All Events"
    />

    <!-- ********** -->

    <h2>ResponsiveImage</h2>
    <!-- if {{ imageCarousel.length == 1}}
      <responsive-image
            :media="imageCarousel[0].image"
        >
        <template v-slot:credit>
               {{imageCarousel[0]?.creditText}}
        </template>
</responsive-image>
-->
    <p><strong>Image:</strong> </p>
    {{ imageCarousel && imageCarousel.length > 0 ? imageCarousel[0]?.image : "No Image" }}
    <p>
      <strong>Credit:</strong> {{ imageCarousel && imageCarousel.length > 0 ? imageCarousel[0]?.creditText : "No Image"
      }}
    </p>
    <!-- if {{ imageCarousel?.length > 1}} -->
    <h2>ImageCarousel</h2>
    <p>{{ imageCarousel }}</p>

    <!-- ********** -->

    <h2>CardMeta</h2>
    <h3>eventTitle: {{ eventTitle }}</h3>
    <p>Category: {{ series[0].title }}</p>
    <p>Title: {{ eventTitle }}</p>
    <p>TagLabels: {{ cardMetaTags }}</p>
    <p>Introduction: {{ cardMetaIntro }}</p>
    <p>EventDescription/Text: {{ cardMetaText }}</p>
    <!--
      add to the if statement
    -->
    <card-meta
      v-if="eventTitle"
      :category="series[0].title"
      :title="eventTitle"
      :tagLabels="cardMetaTags"
      :introduction="cardMetaIntro"
      :text="cardMetaText"
    />


    <h2>GUEST SPEAKER:</h2><!-- not part of the cardMeta-->
    <rich-text
      v-if="page.guestSpeaker"
      :rich-text-content="page.guestSpeaker"
    />

    <h2>ACKNOWLEDEMENTS:</h2><!-- not part of the cardMeta-->
    <rich-text
      v-if="page.acknowledements"
      :rich-text-content="page.acknowledements"
    />

    <divider-way-finder />

    <!--
      ScreeningDetails / BlockScreening is an Array
      One event can have
      ONE screening
      OR multiple Screenings -->
    <h4>BlockScreening</h4>
    <div v-if="screeningDetails && screeningDetails.length > 0">
      <p>
        <strong>Title: </strong> {{ screeningDetails && screeningDetails.length > 0 ?
        screeningDetails[0].screeningTitle
        :
        "No screening title" }}
      </p>
      <p>
        <strong>AlternativeTitle: </strong> {{ screeningDetails && screeningDetails.length > 0 ?
        screeningDetails[0].alternateTitle : "No screening details" }}
      </p>

      <p>
        <!-- use  a v-for for avoinding undefined errors-->
        <strong>Inline value of lang atribute for alternateTitle: </strong> {{ screeningDetails &&
        screeningDetails.length
        > 0 ? screeningDetails[0].languageTranslated : "No screening detail for this event" }}
      </p>

      <p><strong>Year: </strong> {{ screeningDetails[0].year }}</p>

      <p><strong>Country: </strong> {{ screeningDetails[0].country }}</p>
      <p><strong>Language: </strong> {{ screeningDetails[0].languageInfo }}</p>
      <p><strong>Runtime: </strong> {{ screeningDetails[0].runtime }}</p>

      <p>
        <strong>ScreeningTags: </strong>
      <p v-if="screeningDetails[0].screeningTags && screeningDetails[0].screeningTags.length > 0">
        {{ screeningDetails[0].screeningTags[0].title }}
      </p>
      </p> Array
      <p><strong>descriptionOfScreening: </strong> {{ screeningDetails[0].descriptionOfScreening }}</p>
    </div>
    <h2>SideBar</h2>
    <h3>BlockEventDetailDateTime</h3>
    <div v-if="eventDetailLocation && eventDetailLocation.length > 0">
      <h4>Date: {{ startDate }}</h4>
      <h4>Time: {{ startTime }}</h4>

      <h3>eventDetailLocation: {{ eventDetailLocation }}</h3>// title/uri
      <h4>eventDetailLocation Title: {{ eventDetailLocation[0].title }}</h4>
      <h4>eventDetail Uri: {{ eventDetailLocation[0].uri }}</h4>
    </div>
    <!------>
    <h3>InfoBlock</h3>
    <h4>blockInfo: {{ blockInfo }}</h4>
    <block-info :ftvaTicketInformation='blockInfo' />
    <hr>
    <!------>

    <!-- If this event is part of an EventSeries;
       display other events in the same series. -->
    <!-- {{ series }} -->
    <div>
      More in this series
      <div>CardWithImage</div>
      <div>
        <!-- {{ series }} Array -->
        title
        date | time
      </div>
    </div>
    <!-- "ftvaEventScreeningDetails": [
      {
        "id": "3155837",
        "screeningTitle": "Step Up: High Water / Season 1 - Duets",
        "alternateTitle": null,
        "year": "2018",
        "country": "USA",
        "languageTranslated": "fr",
        "languageInfo": "English",
        "runtime": null,
        "screeningTags": [],
        "descriptionOfScreening": null,
        "trailer": null,
        "typeHandle": "screeningDetails"
      }
    -->

    <h3>ftvaEventSeries</h3>
    <code> {{ data.ftvaEventSeries }} </code>
  </main>
</template>
