<script setup>
// COMPONENTS
import { DividerWayFinder } from 'ucla-library-website-components'
// GQL
import FTVAEventSeriesList from '../gql/queries/FTVAEventSeriesList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('event-list', async () => {
  const data = await $graphql.default.request(FTVAEventSeriesList)
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entries) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

</script>
<template>
  <div
    class="page page-events"
    style="padding: 25px 100px;"
  >
    <div class="header">
      <h2>Screening Series</h2>
      <p class="text">Discover the magic of our Upcoming Series, where we curate an immersive experience that transcends
        time and
        genre. From classic masterpieces to cutting-edge contemporary works, our series showcase the diverse voices and
        visions that have shaped the evolution of visual storytelling.</p>
    </div>

    <DividerWayFinder />

    <div
      class="events"
      v-for="event in data.entries"
      :key="event.id"
    >
      <NuxtLink :to="event.to">
        {{ event.title }}
      </NuxtLink> <br>
    </div>
  </div>
</template>
<style scoped>
.page-events {
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: center;
  }

  .events {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

  }

  a {
    outline-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  }

  a:link {
    color: #6900ff;
  }

  a:visited {
    color: #a5c300;
  }

  a:focus {
    text-decoration: none;
    background: #bae498;
  }

  a:hover {
    text-decoration: none;
    background: #cdfeaa;
  }

  a:active {
    background: #6900ff;
    color: #cdfeaa;
  }
}
</style>
