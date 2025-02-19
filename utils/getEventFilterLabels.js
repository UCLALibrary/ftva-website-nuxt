/**
 * Extract tag labels from FTVA filters (ftvaScreeningFormatFilters,
ftvaEventTypeFilters) and return as a single array

 * @param {Object}
 * @returns {Array}
 */

export default function getEventFilterLabels(obj) {
  if (!obj) return []
  if (!obj.ftvaEventTypeFilters && !obj.ftvaScreeningFormatFilters) {
    return []
  }

  const parsedTagLabels = []

  const eventTypeFilters = obj.ftvaEventTypeFilters
  const screeningFormatFilters = obj.ftvaScreeningFormatFilters

  if (eventTypeFilters.length) {
    eventTypeFilters.forEach(obj => parsedTagLabels.push({ title: obj.title, isHighlighted: false }))
  }

  if (screeningFormatFilters.length) {
    screeningFormatFilters.forEach(obj => parsedTagLabels.push({ title: obj.title, isHighlighted: false }))
  }
  return parsedTagLabels
}
