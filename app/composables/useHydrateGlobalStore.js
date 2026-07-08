// composables/useHydrateGlobalStore.js
// GQL
import FooterPrimaryItems from '../../gql/queries/FooterPrimaryItems.gql'
import FooterSockItems from '../../gql/queries/FooterSockItems.gql'
import FooterLinkItems from '../../gql/queries/FooterLinkItems.gql'
import Globals from '../../gql/queries/Globals.gql'
import HeaderItems from '../../gql/queries/HeaderItems.gql'
export function useHydrateGlobalStore() {
  const { $graphql } = useNuxtApp()
  const store = useGlobalStore()

  // Fixed keys => Nuxt can reuse/dedupe across prerendered routes
  const globals = useAsyncData('global-globals', async () => {
    const data = await $graphql.default.request(Globals)
    return data
  })

  const header = useAsyncData('global-header', async () => {
    const data = await $graphql.default.request(HeaderItems)
    return data
  })

  const footerPrimary = useAsyncData('global-footer-primary', async () => {
    const data = await $graphql.default.request(FooterPrimaryItems)
    return data
  })

  const footerSock = useAsyncData('global-footer-sock', async() =>
  { const data = await $graphql.default.request(FooterSockItems)
    return data
  })

  const footerLinks = useAsyncData('global-footer-links', async () => {
    const data = await $graphql.default.request(FooterLinkItems)
    return data
  })

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

  // Hydrate Pinia once data arrives (SSR + client).
  // Only set if empty so you don't overwrite client state.
  watchEffect(() => {
    if (header.data.value && Object.keys(store.header || {}).length === 0) {
      store.header.primary = header?.data?.value?.primary
    }

    if (globals.data.value && Object.keys(store.globals || {}).length === 0) {
      // If your API already returns the shaped object, assign directly.
      // If it returns { globalSets: [...] }, shape it here to match your components.
      const globalData = removeEmpties(globals.data.value?.globalSets || [])
      // console.log("remove empties: " + JSON.stringify(globalData))
      // Shape data from Craft
      const craftData = Object.fromEntries(
        globalData?.map(item => [item.handle, item])
      )

      store.globals = craftData
    }

    if (footerPrimary.data.value && Object.keys(store.footerPrimary || {}).length === 0) {
      store.footerPrimary = {
        nodes: [
          {
            ...footerPrimary?.data?.value?.footerPrimary[0]
          },
          {
            ...footerPrimary?.data?.value?.footerPrimary[1]
          }
        ]
      }
      footerPrimary.data.value
    }

    if (footerSock.data.value && Object.keys(store.footerSock || {}).length === 0) {
      store.footerSock.nodes = footerSock.data.value.footerSock
    }

    if (footerLinks.data.value && Object.keys(store.footerLinks || {}).length === 0) {
      const craftData = removeEmpties(footerLinks.data.value?.footerLinks || [])
      console.log('meap links data', craftData)
      store.footerLinks.nodes = footerLinks.data.value?.footerLinks
    }
  })

  const pending = computed(() =>
    header.pending.value ||
    globals.pending.value ||
    footerPrimary.pending.value ||
    footerSock.pending.value ||
    footerLinks.pending.value
  )

  const error = computed(() =>
    header.error.value ||
    globals.error.value ||
    footerPrimary.error.value ||
    footerSock.error.value ||
    footerLinks.error.value
  )

  return { pending, error }
}
