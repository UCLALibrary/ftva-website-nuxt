// plugins/vuetify.ts
import 'vuetify/styles' // Import Vuetify styles
import { createVuetify } from 'vuetify'
import { VCalendar } from 'vuetify/labs/VCalendar' // Import VCalendar
import '@mdi/font/css/materialdesignicons.css' // Import Material Design Icons

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components: {
      VCalendar,
    },
  })

  nuxtApp.vueApp.use(vuetify) // Register Vuetify in the Vue instance
})
