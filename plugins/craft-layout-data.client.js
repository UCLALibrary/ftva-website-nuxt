// GQL
import FTVALayout from '../gql/queries/FTVALayout.gql'

export default defineNuxtPlugin((nuxtApp) => { //
  const { $graphql } = useNuxtApp()
  const globalStore = useGlobalStore()
  // console.log('Nuxt plugin client side called from Default layout')
  const layoutData = async () => {
    // console.log('Nuxt plugin ready to call graphQL API in Default layout')

    const data = await $graphql.default.request(FTVALayout)

    // console.log('Pinia store Global Data object:' + JSON.stringify(data))
    if (data) {
      globalStore.header.primary = data?.primary
      globalStore.footerLinks.nodes = data?.footerLinks
      globalStore.footerSock.nodes = data?.footerSock
      globalStore.footerPrimary = {
        nodes: [
          {
            ...data?.footerPrimary[0]
          },
          {
            ...data?.footerPrimary[1]
          }
        ]
      }

      console.log('globalStore.footerPrimary', JSON.stringify(globalStore.footerPrimary))
    }
  }
  return {
    provide: {
      layoutData,
    },
  }
})
