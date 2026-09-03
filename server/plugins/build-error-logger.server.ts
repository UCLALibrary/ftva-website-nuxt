export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    console.error(
      '[BUILD-ERROR][NITRO]',
      JSON.stringify({
        route: event?.path || '',
        message: error.message || String(error),
        stack: error.stack || ''
      })
    )
  })
})
