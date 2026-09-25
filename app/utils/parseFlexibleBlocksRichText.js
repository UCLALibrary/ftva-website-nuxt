import stripHtmlFromField from './stripHtmlFromField'

// Helper to parse FlexibleBlocks on the General Content and Blog templates.
// Parses RichText blocks into plain text for indexing/search.

function parseFlexibleBlocksRichText(blocks = []) {
  // Always return an array
  const richTextBlocks = blocks.filter(
    block => block.typeHandle === 'richText'
  )

  if (!richTextBlocks.length) {
    return []
  }

  return richTextBlocks.map(block => stripHtmlFromField(block.richText || ''))
}

export default parseFlexibleBlocksRichText
