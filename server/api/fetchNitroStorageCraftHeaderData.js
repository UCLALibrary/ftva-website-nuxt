const MenuItem = `
            id
            name: title
            to: url
            classes
            target: newWindow
    `
const headerQuery = `
    query HeaderMainMenuItems {
        primary: nodes(navHandle: "ftvaPrimaryMenu", level: 1) {
            ${MenuItem}
            children {
                ${MenuItem}
            }
        }
    }
`
export default cachedEventHandler(async () => {
  const endpoint = useRuntimeConfig().public.craftGraphqlURL
  let headerData = await useStorage().getItem('ftvaCraftData:header')
  // console.log('Server api Craft Header Data object:' + JSON.stringify(headerData))
  if (!headerData) {
    const { data } = await $fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: headerQuery })
    })
    await useStorage().setItem('ftvaCraftData:header', data)
    headerData = data
    // console.log('Server api Header Data object first set and then get:' + JSON.stringify(headerData))
  }
  return headerData
})
