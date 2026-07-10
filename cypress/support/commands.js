Cypress.Commands.add('getByData', (selector) => {
  return cy.get(`[data-test=${selector}]`)
})

Cypress.Commands.add('visualSnapshot', (name) => {
  const provider = Cypress.env('VISUAL_PROVIDER') // "chromatic" | "percy" | undefined

  if (provider === 'chromatic') {
    const w = Cypress.config('viewportWidth')
    const h = Cypress.config('viewportHeight')
    cy.takeSnapshot(`${name} - ${w}x${h}`)
  }
})

// TODO: add moderate to the default impacts when all serious and critical violations are fixed
const DEFAULT_A11Y_IMPACTS = ['critical', 'serious']

Cypress.Commands.add(
  'checkCriticalA11y',
  (selector = '#main', impacts = [...DEFAULT_A11Y_IMPACTS]) => {
    cy.injectAxe()
    cy.checkA11y(selector, { includedImpacts: impacts }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id} ${violation.impact}
Description: ${violation.description}
Help: ${violation.help} ${violation.helpUrl}
HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
      })
    })
  }
)
