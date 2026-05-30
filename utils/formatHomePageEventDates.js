import format from 'date-fns/format'

/**
 * Format a single date for FTAV events
 * Example output: "SAT, APR 25"
 *
 * @param {string} date
 * @returns {string}
 */
function formatHomePageEventDates(date = '') {
  if (!date) return ''

  return format(new Date(date), 'EEE, MMM d').toUpperCase()
}

export default formatHomePageEventDates
