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

// const parsedImage = computed(() => {
//   return page.value.heroImage[0].image[0]
// })

// const parsedftvaEvent = computed(() => {
// const current = page.id;
// const seriesEvents = series.ftvaEvent
// if (series.ftvaEvent && series.ftvaEvent.length > 0)
// exclude the current page
// get three series items

//var itemsWithoutCurrent = items.filter(function (x) { return x !== current; });
//})


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

    <NavBreadcrumb
      v-if="page.title"
      :title="page.title"
      class="breadcrumb"
      to="/events"
      parent-title="All Events"
    />

    <!-- ********** -->
    <h3>PAGE.ID:: {{ page.id }}</h3>
    <h3>SERIES.FTVAEVENT:: {{ series[0].ftvaEvent }}</h3>

    <!-- <h4>{{ page }}</h4> -->

    <section-wrapper section-title="ResponsiveImage or ImageCarousel">

      <h3>page.imageCarousel.length:: {{ page.imageCarousel.length }}</h3>
      <p v-if="page.imageCarousel">
        <strong>IMAGE CAROUSEL:</strong>
        {{ page.imageCarousel && page.imageCarousel.length > 0 ? page.imageCarousel : "No Image" }}
      </p>

      <h3>{{ page.imageCarousel[0].image }}</h3>

      <!-- <ResponsiveImage :media="page.imageCarousel">
        <template v-slot:credit>
          {{ credit }}
        </template>
</ResponsiveImage> -->
      <!-- <h3>{{ parsedImage }}</h3> -->
      <!-- <ResponsiveImage
        v-if="page.heroImage.length > 0"
        :media="parsedImage"
        class="bookplate"
      /> -->

      <!-- <ResponsiveImage
        v-if="page.portrait && page.portrait.length > 0"
        :media="page.portrait[0]"
        :aspect-ratio="60"
        class="portrait-Ginny"
        alt="Sketch of Ginny Steel wearing glasses and a grey blazer, with a yellow background"
      /> -->

      <!-- <flexible-media-gallery-new-lightbox :items="items" /> -->

      <!-- <responsive-image

        v-if="page.imageCarousel && page.imageCarousel.length > 0"
        :media="page.imageCarousel[0].image[0]"
        :aspect-ratio="60"
        class="image-carousel"
        alt="imageCarousel"
      >
        <template #credit>
          {{ page.imageCarousel[0].creditText }}
        </template>
</responsive-image> -->

      <!-- <flexible-media-gallery-new-lightbox :items="page.imageCarousel" /> -->
      <!-- <flexible-media-gallery-new-lightbox
        class="homepage"
        :items="page.imageCarousel"
      >
        <template v-slot="slotProps">
          <BlockTag :label="mockTags[slotProps.selectionIndex]" />
        </template></ flexible-media-gallery-new-lightbox> -->
    </section-wrapper>

    <!-- ********** -->
    <!-- CardMeta -->

    <section-wrapper>
      <card-meta
        :category="series[0].title"
        :title="page.title"
        :tagLabels="page.ftvaEventFilters"
        :introduction="page.ftvaEventIntroduction"
        :text="page.eventDescription"
      />
    </section-wrapper>

    <section-wrapper section-title="Guest Speaker & Acknowledements">
      <rich-text
        v-if="page.guestSpeaker"
        :rich-text-content="page.guestSpeaker"
      />

      <rich-text
        v-if="page.acknowledements"
        :rich-text-content="page.acknowledements"
      />
    </section-wrapper>

    <section-wrapper>
      <divider-way-finder />
    </section-wrapper>

    <!-- ********** -->
    <!-- SectionScreening -->

    <section-wrapper section-title="SectionScreening">
      <!--
    <div>
      <section-screening-details
        :items="page.ftvaEventScreeningDetails"
      />
    </div>
    -->
      <h3>page.ftvaEventScreeningDetails:</h3>
      <code>{{ page.ftvaEventScreeningDetails }}</code>
    </section-wrapper>

    <!-- ********** -->
    <!-- SIDEBAR-->

    <!-- BlockEventDetail -->
    <section-wrapper section-title="SIDEBAR">
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

      <h2>Block Event Detail Component below...</h2>
      <!-- <BlockEventDetail
        :startDate="page.startDate"
        :time="page.startTime"
        :locations="page.location"
      /> -->


      <!-- ********** -->
      <!-- InfoBlock -->

      <hr>
      <h3>INFO BLOCK</h3>
      <h4>blockInfo:</h4>
      <code>{{ page.ftvaTicketInformation }}</code>

      <h2>INFO BLOCK Component below...</h2>
      <BlockInfo :ftvaTicketInformation="ftvaTicketInformation" />
    </section-wrapper>

    <!-- ********** -->

    <hr>
    <!-- If this event is part of an EventSeries display other events in the same series. -->
    <!-- WRITE A COMPUTED PROPORTY TO EXCLUDE THE EVENT THAT THIS PAGE DETAILS -->

    <section-wrapper
      v-if="series && series.length > 0"
      section-title="Explore upcoming events in this series"
    >
      <div v-if="series && series.length > 0">
        <h3>CardWithImage</h3>
        <code v-if="series"> {{ series }} </code>
        <!-- THIS COMPONENT IS NOT DONE YET -->
        <!--
        <section-card-with-image :items="series.ftvaEvent" />
      -->
      </div>
    </section-wrapper>

    <h2>PAGE::: {{ page }}</h2>
    <hr>
    <hr>
    <h2>SERIES::: {{ series }}</h2>
  </main>
</template>
