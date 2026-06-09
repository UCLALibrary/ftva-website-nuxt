import { defineConfig } from 'cypress'
import { installPlugin } from '@chromatic-com/cypress'

export default defineConfig({
  // For chtomatic tests, we disable auto snapshots at the end and use the 3 viewport snapshots instead
  env: {
    disableAutoSnapshot: true,
  },
  defaultCommandTimeout: 60000,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      // ✅ Only enable Chromatic when token is present
      if (process.env.CHROMATIC_PROJECT_TOKEN) {
        installPlugin(on, config)
      } else {
        on('task', {
          // Overwrite the log command so we can log axe-core violations to the console
          log(message) {
            console.log(message)
            return null
          },
          // ✅ Register the task Chromatic support expects, prepareArchives
          prepareArchives() {
            // If you don't need it, no-op is fine
            return null
          },
        })
      }

      return config
    },
    baseUrl: 'http://localhost:3000'
  },
  retries: 2
})
