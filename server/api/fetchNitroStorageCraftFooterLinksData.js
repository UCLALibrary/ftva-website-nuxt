const MenuItem = `
            id
            name: title
            to: url
            classes
            target: newWindow
    `
query FTVAFooterLinks {
  nodes(navHandle: "ftvaFooterNav", level: 1) {

    children(level: 2) {
      category: parent {
        title
      }
      ...MenuItem
    }
  }
}
`
export default cachedEventHandler(async () => {
  const endpoint = useRuntimeConfig().public.craftGraphqlURL
  let footerLinksData = await useStorage().getItem('ftvaCraftData:footerLinks')
  console.log('Server api Craft Footer Links Data object:' + JSON.stringify(footerLinksData))
  if (!footerLinksData) {
    const { data } = await $fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: footerLinksQuery })
    })
    await useStorage().setItem('ftvaCraftData:footerLinks', data)
    footerLinksData = data
    // console.log('Server api Craft Footer Links Data object first set and then get:' + JSON.stringify(footerLinksData))
  }
  return footerLinksData
})
