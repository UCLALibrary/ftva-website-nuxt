import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runFilmmakerDetailTests({ withSnapshot = false } = {}) {
  it('Visits the LA Rebellion Filmmaker Detail page', () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person')

    if (withSnapshot) {
      cy.visualSnapshot('larebellionfilmmakersdetail')
    }
  })

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person', { failOnStatusCode: false })
    cy.injectAxe()
    // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
    cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id} ${violation.impact} 
        Description: ${violation.description} 
        Help: ${violation.help} ${violation.helpUrl} 
        HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
      })
    })
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Filmmakers Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runFilmmakerDetailTests({ withSnapshot: true })
    })
  })
} else {
  describe('Filmmakers Detail Page', () => {
    runFilmmakerDetailTests({ withSnapshot: false })
  })
}
