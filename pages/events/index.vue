<script setup>
// COMPONENTS
import { DividerWayFinder } from 'ucla-library-website-components'
// GQL
import FTVAEventList from '../gql/queries/FTVAEventList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('event-list', async () => {
  const data = await $graphql.default.request(FTVAEventList)
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
    <h3>This is Sample Event listing page</h3>
    <DividerWayFinder />
    <div
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
  a {
    outline-color: transparent;
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
