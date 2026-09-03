export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.prerender) {
    return
  }

  nuxtApp.hook('vue:error', (error, instance, info) => {
    const route = useRoute()

    console.error(
      '[BUILD-ERROR][VUE]',
      JSON.stringify({
        route: route.path,
        message:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          error instanceof Error
            ? error.stack
            : undefined,
        info
      })
    )
  })

  nuxtApp.hook('app:error', (error) => {
    const route = useRoute()

    console.error(
      '[BUILD-ERROR][NUXT]',
      JSON.stringify({
        route: route.path,
        message:
          error instanceof Error
            ? error.message
            : String(error),
        stack:
          error instanceof Error
            ? error.stack
            : undefined
      })
    )
  })
})
