// plugins/vuetify.ts
import { createVuetify } from 'vuetify'
import { VCalendar } from 'vuetify/labs/VCalendar' // Import VCalendar
import { VCard, VList, VListItem, VMenu, VSheet, VSlideGroup, VSlideGroupItem } from 'vuetify/lib/components/index.mjs'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components: {
      VCalendar, VSheet, VMenu, VList, VCard, VListItem, VSlideGroup, VSlideGroupItem,
    },
  })

  nuxtApp.vueApp.use(vuetify) // Register Vuetify in the Vue instance
})
