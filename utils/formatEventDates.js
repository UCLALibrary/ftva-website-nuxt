/* STOP-DO-NOT-EDIT-THIS-FILE */
/* This file is a copy of the util found in the ucla-library-website-components repo,
it should be kept in sync with the original file. This file should ONLT be updated with any changes made to the original file.
*/

import { format } from 'date-fns/format'

/**
 * Take two date strings, and return them in human readable date formats for Events
 *
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} dateFormat - 'long', 'short', or 'shortWithYear'
 * @returns {string}
 */

function formatDates(startDate = '', endDate = '', dateFormat = 'long') {
  const start = format(new Date(startDate), 'MMMM d, y')
  // console.log(start)
  const end = format(new Date(endDate), 'MMMM d, y')

  // "February 11 2020 – May 31 2021"
  let output = `${start} - ${end}`

  if (start === end) {
    // Thursday, January 28
    output = format(new Date(startDate), 'MMMM d, y')
  }

  if (!endDate) {
    // February 11 2020
    output = start
  }

  if (dateFormat === 'short' || dateFormat === 'shortWithYear') {
    // "Feb 11 2020"
    const day = output.slice(0, 3)
    const dateYear = output.split(' ').slice(1).join(' ')
    if (endDate && endDate !== startDate) {
      // Feb 11 – May 31
      const shortFormatStartDate = format(new Date(startDate), 'MMM d')
      const shortFormatEndDate = format(new Date(endDate), 'MMM d')
      // if 'shortWithYear' is selected, add the year to the end date
      // Feb 11 – May 31 2020
      if (dateFormat === 'shortWithYear') {
        const shortFormatEndDateYear = format(new Date(endDate), 'MMM d, y')
        return `${shortFormatStartDate} - ${shortFormatEndDateYear}`
      }
      return `${shortFormatStartDate} - ${shortFormatEndDate}`
    }
    return `${day} ${dateYear}`
  }

  return output
}

export default formatDates
