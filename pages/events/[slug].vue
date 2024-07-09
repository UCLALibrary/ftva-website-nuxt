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

const page = ref(_get(data.value, 'ftvaEvent', {}))
const series = ref(_get(data.value, 'ftvaEventSeries', {}))

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

    <!--THE COMPONENTS ON THIS PAGE ARE JUST REFERENCES AND NEED TO BE UPDATED WITH THE CORRECT DATA AND IF STATEMENTS-->

    <NavBreadcrumb
      v-if="page"
      :title="page.title"
      class="breadcrumb"
      to="/events"
      parent-title="All Events"
    />

    <!-- ********** -->
    <!-- ImageCarousel -->

    <section-wrapper sectionTitle="ResponsiveImage or ImageCarousel">
      <h2>ResponsiveImage</h2>
      <p><strong>Image:</strong></p>
      <code>{{ page.imageCarousel && page.imageCarousel.length > 0 ? page.imageCarousel[0]?.image : "No Image" }}</code>

      <p><strong>Credit:</strong></p>
      <p>{{ page.imageCarousel && page.imageCarousel.length > 0 ? page.imageCarousel[0]?.creditText : "No Image" }}</p>
      <h2>page.ImageCarousel</h2>
      <p>{{ page.imageCarousel }}</p>
      <!-- v-if= "page.imageCarousel.length == 1 && page.imageCarousel.length == 1" -->
      <responsive-image :media="page.imageCarousel[0].image[0]">
        <template v-slot:credit>
          {{ page.imageCarousel[0].image[0].creditText }}
        </template>
      </responsive-image>

      <responsive-image
        v-if="page.portrait && page.portrait.length > 0"
        :media="page.portrait[0]"
        :aspect-ratio="60"
        class="portrait-Ginny"
        alt="Sketch of Ginny Steel wearing glasses and a grey blazer, with a yellow background"
      />
    </section-wrapper>

    <!-- ********** -->
    <!-- CardMeta -->

    <section-wrapper sectionTitle="CardMeta">
      <h3 v-if="page.title">eventTitle: {{ page.title }}</h3>
      <p v-if="series[0].title">Category: {{ series[0].title }}</p>
      <p v-if="eventTitle">Title: {{ eventTitle }}</p>
      <p v-if="page.ftvaEventFilters">TagLabels: {{ page.ftvaEventFilters }}</p>
      <p v-if="page.ftvaEventIntroduction">Introduction: {{ page.ftvaEventIntroduction }}</p>
      <p v-if="page.eventDescription">EventDescription/Text: {{ page.eventDescription }}</p>

      <!--
      <card-meta
        v-if="eventTitle"
        :category="series[0].title"
        :title="page.title"
        :tagLabels="page.ftvaEventFilters"
        :introduction="page.ftvaEventIntroduction"
        :text="page.eventDescription"
      />
    -->
    </section-wrapper>

    <section-wrapper>
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
    </section-wrapper>

    <section-wrapper>
      <divider-way-finder />
    </section-wrapper>


    <!-- ********** -->
    <!-- BlockScreening -->

    page.ftvaEventScreeningDetails

    <section-wrapper sectionTitle="SectionScreening">
      <!--
      ScreeningDetails / BlockScreening is an Array
      One event can have
      ONE screening
      OR multiple Screenings
    -->

      <div v-if="page.ftvaEventScreeningDetails && page.ftvaEventScreeningDetails.length > 0">
        <p>
          <strong>Title: </strong> {{ page.ftvaEventScreeningDetails && page.ftvaEventScreeningDetails.length > 0 ?
        page.ftvaEventScreeningDetails[0].screeningTitle
        :
        "No screening title" }}
        </p>
        <p>
          <strong>AlternativeTitle: </strong> {{ page.ftvaEventScreeningDetails && page.ftvaEventScreeningDetails.length
        > 0
        ?
        page.ftvaEventScreeningDetails[0].alternateTitle : "No screening details" }}
        </p>

        <p>
          <!-- use  a v-for for avoinding undefined errors-->
          <strong>Inline value of lang atribute for alternateTitle: </strong> {{ page.ftvaEventScreeningDetails &&
        page.ftvaEventScreeningDetails.length
        > 0 ? page.ftvaEventScreeningDetails[0].languageTranslated : "No screening detail for this event" }}
        </p>

        <p><strong>Year: </strong> {{ page.ftvaEventScreeningDetails[0].year }}</p>

        <p><strong>Country: </strong> {{ page.ftvaEventScreeningDetails[0].country }}</p>
        <p><strong>Language: </strong> {{ page.ftvaEventScreeningDetails[0].languageInfo }}</p>
        <p><strong>Runtime: </strong> {{ page.ftvaEventScreeningDetails[0].runtime }}</p>

        <strong>ScreeningTags: </strong>
        <p
          v-if="page.ftvaEventScreeningDetails[0].screeningTags && page.ftvaEventScreeningDetails[0].screeningTags.length > 0">
          {{ page.ftvaEventScreeningDetails[0].screeningTags }}</p>
      </div>
      <br>
      <h3>page.ftvaEventScreeningDetails:</h3>
      <code>{{ page.ftvaEventScreeningDetails }}</code>
    </section-wrapper>

    <!-- ********** -->
    <!-- SIDEBAR-->

    <!-- BlockEventDetail -->
    <section-wrapper sectionTitle="SIDEBAR">

      <h3>BlockEventDetail</h3>
      <div>
        <h4 v-if="page.startDate">Date: {{ page.startDate }}</h4>
        <h4 v-if="page.startTime">Time: {{ page.startTime }}</h4>
        <h4 v-if="page.location">Location: {{ page.location }}</h4>
      </div>

      <!--
      <BlockEventDetail
        :startDate="page.startDate"
        :time="page.startTime"
        :locations="page.location"
      />
      -->

      <!-- ********** -->
      <!-- InfoBlock -->

      <hr>
      <h3>InfoBlock</h3>
      <h4>blockInfo:</h4>
      <code>{{ page.ftvaTicketInformation }}</code>
      <!--
      <block-info :ftvaTicketInformation='page.ftvaTicketInformation' />
    -->
    </section-wrapper>

    <!-- ********** -->

    <hr>
    <!-- If this event is part of an EventSeries display other events in the same series. -->
    <!-- WRITE A COMPUTED PROPORTY TO EXCLUDE THE EVENT THAT THIS PAGE DETAILS -->

    <section-wrapper sectionTitle="Explore upcoming events in this series">

      <div v-if="series && series.length > 0">
        <h3>CardWithImage</h3>
        <code> {{ series }} </code>
        <!-- THIS COMPONENT IS NOT DONE YET -->
        <!--
        <section-card-with-image :items="series.ftvaEvent" />
      -->
      </div>

    </section-wrapper>
  </main>
</template>
