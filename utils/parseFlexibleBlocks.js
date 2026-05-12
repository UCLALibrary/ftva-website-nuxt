// Helper to parse FlexibleBlocks on the General Content and ARSCIMCS templates. Parses data for InfoBlock and SimpleCards.
// Optional responsive `sizes` for blocks containing images.

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

      // Check card.uri for leading 'ftva/' and remove it
      // And Check card.contentLink for leading 'ftva/' remove it from the URI stored in contentLink for GeneralContent
      if (content.uri) {
        const uriWithoutLeadingFtvaString = content.uri ? `/${content.uri.replace(/^\/?ftva\//i, '')}` : '/'
        card = {
          ...card,
          contentLink: [
            {
              ...content,
              uri: uriWithoutLeadingFtvaString
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

const SIZES_CARD_WITH_IMAGE = '322px'
const SIZES_MEDIA_WITH_TEXT =
  '(min-width: 1000px) 400px, (min-width: 760px) calc(112.27vw - 140px), calc(112.95vw - 55px)'
const SIZES_MEDIA_GALLERY =
  '(min-width: 1360px) 1160px, (min-width: 760px) calc(91.03vw - 60px), calc(100vw - 48px)'

/** Clone only branches that need `sizes` for ResponsiveImage; avoids mutating CMS data. */
function applyResponsiveImageSizes (block) {
  if (block.typeHandle === 'cardWithImage' && block.cardWithImage?.length > 0) {
    return {
      ...block,
      cardWithImage: block.cardWithImage.map(card => ({
        ...card,
        image: (card.image || []).map(image => ({
          ...image,
          sizes: SIZES_CARD_WITH_IMAGE,
        })),
      })),
    }
  }
  if (block.typeHandle === 'mediaWithText' && block.mediaWithText?.length > 0) {
    return {
      ...block,
      mediaWithText: block.mediaWithText.map(media => ({
        ...media,
        coverImage: media.coverImage?.map(image => ({
          ...image,
          sizes: SIZES_MEDIA_WITH_TEXT,
        })),
      })),
    }
  }
  if (block.typeHandle === 'mediaGallery' && block.mediaGallery?.length > 0) {
    return {
      ...block,
      mediaGallery: block.mediaGallery.map(gallery => ({
        ...gallery,
        item: gallery.item?.map(image => ({
          ...image,
          sizes: SIZES_MEDIA_GALLERY,
        })),
      })),
    }
  }
  return block
}

/**
 * @param {unknown[]} blocks
 * @param {{ withResponsiveImageSizes?: boolean }} [options]
 */
function parseFlexibleBlocks (blocks, options = {}) {
  const { withResponsiveImageSizes = false } = options
  return blocks.map((block) => {
    let newBlock = withResponsiveImageSizes ? applyResponsiveImageSizes(block) : block

    if (newBlock.typeHandle === 'infoBlock') {
      newBlock = parseInfoBlockAddress(newBlock)
    }

    if (newBlock.typeHandle === 'simpleCards') {
      newBlock = parseSimpleCard(newBlock)
    }

    return newBlock
  })
}

export default parseFlexibleBlocks
