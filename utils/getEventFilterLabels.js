/**
 * Extract tag labels from FTVA filters (ftvaScreeningFormatFilters,
ftvaEventTypeFilters) and return as a single array

 * @param {Object}
 * @returns {Array}
 */

export function getEventFilterLabels(obj) {
  if (!obj.ftvaEventTypeFilters && !obj.ftvaScreeningFormatFilters) {
    return []
  }

  const parsedTagLabels = []

  const eventTypeFilters = obj.ftvaEventTypeFilters
  const screeningFormatFilters = obj.ftvaScreeningFormatFilters

  if (eventTypeFilters.length) {
    eventTypeFilters.forEach(obj => parsedTagLabels.push({ title: obj.title }))
  }

  if (screeningFormatFilters.length) {
    screeningFormatFilters.forEach(obj => parsedTagLabels.push({ title: obj.title }))
  }
  return parsedTagLabels
}
