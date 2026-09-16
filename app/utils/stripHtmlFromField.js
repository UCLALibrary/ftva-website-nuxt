import { convert } from 'html-to-text'

function stripHtmlFromField(value) {
  if (Array.isArray(value)) {
    return value.map(stripHtmlFromField)
  }

  if (typeof value !== 'string') {
    return value
  }

  return convert(value, { wordwrap: false })
}

export default stripHtmlFromField
