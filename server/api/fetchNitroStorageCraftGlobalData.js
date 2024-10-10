const globalsQuery = `
        query Globals {
          globalSets {
            ... on ftvaViewingInformation_GlobalSet {
              handle
              title: titleGeneral
              text: richTextSimplified
            }
          }
        }
    `
export default cachedEventHandler(async (event) => {
  const endpoint = useRuntimeConfig().public.craftGraphqlURL

  // const keys = await useStorage().getKeys()
  // console.log('Server api storage keys:' + JSON.stringify(keys))
  let globalData = await useStorage().getItem('ftvaCraftData:globals')
  // console.log('Server api Global Data object:' + JSON.stringify(globalData))
  if (!globalData) {
    const { data } = await $fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: globalsQuery })
    })
    await useStorage().setItem('ftvaCraftData:globals', data)
    globalData = data
    // console.log('Server api Global Data object first set and then get:' + JSON.stringify(globalData))
  }
  return globalData
})
