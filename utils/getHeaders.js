// Find all elements with class name "section-header2" or "section-header3"
// Loop through each section-header element and push it into the array
// Excludes the section-header2 More Information which is a visually-hidden element above the divider-way-finder in the Flexible Block component

export default function getHeadersMethod() {
  const elements = document.querySelectorAll('.section-header2, .section-header3, .section-header4')

  const h2Array = []

  elements.forEach((element) => {
    if (element.textContent.trim() !== 'More Information') {
      h2Array.push(element.textContent.trim())
    }
  })

  // console.log('h2Array:', h2Array)

  return h2Array
}
