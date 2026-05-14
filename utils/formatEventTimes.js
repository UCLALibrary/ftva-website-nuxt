/**
 * Take two date strings, and return them in human readable time for Events
 *
 * @param {String} startDate
 * @param {String} endDate
 * @returns {String}
 */

import { format, isValid } from 'date-fns'

function formatTimes(startDate = '', endDate = '') {
  console.log('formatTimes', startDate, 'End Date', endDate)
  if (!startDate) return ''

  const startObj = new Date(startDate)
  if (!isValid(startObj)) return ''

  const start = format(startObj, 'h:mm aaa')

  // no end date → just return start
  if (!endDate) {
    return start
  }

  const endObj = new Date(endDate)
  if (!isValid(endObj)) {
    return start
  }

  const end = format(endObj, 'h:mm aaa')

  // same time → single value
  if (start === end) {
    return start
  }

  // range
  return `${start} - ${end}`
}

export default formatTimes
