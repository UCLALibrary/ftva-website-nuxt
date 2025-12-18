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
function parseSimpleCard(block) {
  if (!block.cards || block.cards.length === 0)
    return block

  const simpleCards = block.cards.map((card) => {
    // External Resource
    if (card.typeHandle === 'externalServiceOrResource') {
      if (card.titleGeneral) {
        return { ...card, title: card.titleGeneral }
      }
      return card
    }

    // Internal Resource
    if (card.typeHandle === 'internalServiceOrResource') {
      const content = card.contentLink?.[0]

      if (!content || !content.uri)
        return card

      const cleanedUri = content.uri.replace(/^\/?ftva\//i, '')

      return {
        ...card,
        contentLink: [
          {
            ...content,
            uri: cleanedUri
          }
        ]
      }
    }

    return card
  })

  return { ...block, cards: simpleCards }
}

// ***** SIMPLE CARDS ***** //

// For internal and external resources, use titleGeneral as SimpleCard title; otherwise, keep default title
// For internal resource, check for leading `ftva/` string in uri and remove if it exists

function parseSimpleCard(block) {
  if (!block.cards || block.cards.length === 0)
    return null

  const simpleCards = block.cards.map((card) => {
    // External Resource
    if (card.typeHandle === 'externalServiceOrResource') {
      if (card.titleGeneral) {
        return { ...card, title: card.titleGeneral }
      }
      return card
    }

    // Internal Resource
    if (card.typeHandle === 'internalServiceOrResource') {
      const content = card.contentLink?.[0]

      if (!content || !content.uri)
        return card

      const cleanedUri = content.uri.replace(/^\/?ftva\//i, '')

      return {
        ...card,
        contentLink: [
          {
            ...content,
            uri: cleanedUri
          }
        ]
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
