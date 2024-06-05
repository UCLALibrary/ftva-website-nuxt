const Image = `
      id
      src: url(transform: "fullscreen")
      height(transform: "fullscreen")
      width(transform: "fullscreen")
      srcset(sizes: ["375", "960", "1280", "1920", "2560"])
      title
      focalPoint
      alt: altText
      kind
      type: mimeType  
    `
const footerSponsorQuery = `
      query FooterSponsorItems {
        footerSponsor: globalSets {
          ... on meapFunders_GlobalSet {
            id
            funders {
              ... on funders_funder_BlockType {
                id
                funderName
                funderLogo {
                  id
                  ... on mediaAndDocuments_Asset {
                    ${Image}
                  }
                }
                funderUrl
              }
            }
          }
        }
      }
    `

export default cachedEventHandler(async () => {
  const endpoint = useRuntimeConfig().public.craftGraphqlURL
  let footerSponsorData = await useStorage().getItem('ftvaCraftData:footerSponsor')
  console.log('Server api Craft Footer sponsor Data object:' + JSON.stringify(footerSponsorData))
  if (!footerSponsorData) {
    const { data } = await $fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: footerSponsorQuery })
    })
    await useStorage().setItem('ftvaCraftData:footerSponsor', data)
    footerSponsorData = data
    console.log('Server api Craft Footer Sponsor Data object first set and then get:' + JSON.stringify(footerSponsorData))
  }
  return footerSponsorData
})
