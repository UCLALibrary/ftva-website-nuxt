// Helper to parse FlexibleBlocks on the General Content and ARSCIMCS templates. Parses data for InfoBlock and SimpleCards.

// ***** INFO BLOCK ***** //

// Remove country data in InfoBlock address
function parseInfoBlockAddress(block) {
  if (!block.infoBlock || block.infoBlock.length === 0)
    return null

  block.infoBlock = block.infoBlock.map((item) => {
    if (item && item.address) {
      return { ...item, address: stripCountry(item.address) }
    }
    return item
  })

  return block
}

// Helper for parseInfoBlockAddress: Remove country from address
function stripCountry(html) {
  if (!html) return null
  return html.replace(/<span\s+class=["']country["'][^>]*>.*?<\/span>/gs, '')
}

// ***** SIMPLE CARDS ***** //

// For internal and external resources, use titleGeneral as SimpleCard title; otherwise, keep default title
// For internal resource, check for leading `ftva/` string in uri and remove if it exists

function parseSimpleCard(block) {
  if (!block.cards || block.cards.length === 0)
    return null

  let simpleCards = block.cards

  simpleCards = simpleCards.map((card) => {
    // External Resource
    if (card.typeHandle === 'externalServiceOrResource') {
      if (card.titleGeneral) {
        card = { ...card, title: card.titleGeneral }
      }
    }

    // Internal Resource
    if (card.typeHandle === 'internalServiceOrResource') {
      let content = card.contentLink[0]

      // Check for titleGeneral
      if (content.titleGeneral) {
        content = { ...content, title: content.titleGeneral }
        card = { ...card, contentLink: [content] }
      }

      // Create card.uri from contentLink URI (remove leading ftva/)
      if (content.uri) {
        const uriWithoutLeadingFtvaString = `/${content.uri.replace(/^\/?ftva\//i, '')}`
        card = { ...card, uri: uriWithoutLeadingFtvaString }
      }

      // Remove "ftva/" from the URI stored in contentLink for GeneralContent
      const safeContent = card.contentLink?.[0]

      if (safeContent?.uri) {
        const cleanedUri = safeContent.uri.replace(/^\/?ftva\//i, '')
        card = {
          ...card,
          contentLink: [
            {
              ...safeContent,
              uri: cleanedUri
            }
          ]
        }
      }
    }

    return card
  })

  return { ...block, cards: simpleCards }
}

// ***** FLEXIBLE BLOCKS ***** //

function parseFlexibleBlocks (blocks) {
  return blocks.map((block) => {
    if (block.typeHandle === 'infoBlock') {
      block = parseInfoBlockAddress(block)
    }

    if (block.typeHandle === 'simpleCards') {
      block = parseSimpleCard(block)
    }

    return block
  })
}

export default parseFlexibleBlocks
