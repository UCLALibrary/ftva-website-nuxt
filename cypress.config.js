import { defineConfig } from 'cypress'
import { installPlugin } from '@chromatic-com/cypress'

export default defineConfig({
  defaultCommandTimeout: 60000,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
       // Only enable Chromatic when CHROMATIC_PROJECT_TOKEN is set
      // (i.e. in the Chromatic workflow)
      if (process.env.CHROMATIC_PROJECT_TOKEN) {
        installPlugin(on, config)
      }
    },
    baseUrl: 'http://localhost:3000'
  },
  retries: 2
})
