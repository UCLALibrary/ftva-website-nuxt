// Find all elements with class name "section-header2" or "section-header3"
// Loop through each section-header element and push it into the array
// Excludes the section-header2 More Information which is a visually-hidden element above the divider-way-finder in the Flexible Block component

export default function getHeaders() {
  if (typeof document === 'undefined') {
    console.warn('getHeaders() called on server-side. Skipping execution.')
    return []
  }

  const elements = document.querySelectorAll('.section-title, .section-header2, .section-header3, section-header4')

  if (!elements.length) {
    console.warn('No header elements found. getHeaders() is running too early.')
    return []
  }

  const h2Array = []

  elements.forEach((element) => {
    if (element.textContent.trim() !== 'More Information') {
      h2Array.push(element.textContent.trim())
    }
  })
  console.log('HEY HEY HEY HEADER ARRAY:', h2Array)
  return h2Array
}

// This Function along with the onMounted function on the page
// Prevents getHeaders() from running during SSR (Server-Side Rendering).
// Adds a setTimeout(500ms) delay to ensure DOM updates are finished.
// Checks for document and .section-header elements before running querySelectorAll().

// See the [...slug].vue page around line 70
// onMounted(() => {
//   if (process.client) {
//     setTimeout(async () => {
//       await nextTick()
//       h2Array.value = getHeaders()
//     }, 500) // Delay ensures DOM is fully updated
//   }
// })
