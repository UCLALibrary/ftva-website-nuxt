import { defineConfig } from 'cypress'
import { installPlugin } from '@chromatic-com/cypress'

export default defineConfig({
  defaultCommandTimeout: 60000,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      installPlugin(on, config)
    },
    baseUrl: 'http://localhost:3000'
  },
  retries: 2
})
