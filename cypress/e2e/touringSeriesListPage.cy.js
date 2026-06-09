import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => { return false })

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runTouringSeriesListTests({ withSnapshot = false } = {}) {
  it('Visits the Touring Series List page', () => {
    cy.visit('/touring-series')

    cy.get('[data-test="page-heading"]').should('be.visible')
    cy.get('[data-test="tab-toggle"]').should('be.visible')
    cy.get('[data-test="tabbed-content"]').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('touringserieslistpage')
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
    cy.visit('/touring-series', { failOnStatusCode: false })
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
    describe(`Touring Series List Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runTouringSeriesListTests({ withSnapshot: true })
    })
  })
} else {
  describe('Touring Series List Page', () => {
    runTouringSeriesListTests({ withSnapshot: false })
  })
}
