import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runBillyWilderTests({ withSnapshot = false } = {}) {
  it('Visits the Billy Wilder Theater Page', () => {
    cy.visit('/billy-wilder-theater')
    cy.getByData('hero-image').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('page-description').should('be.visible')
    cy.getByData('admissions-intro').should('be.visible')
    cy.getByData('admissions-info').should('be.visible')
    cy.getByData('theater-address').should('be.visible')
    cy.getByData('theater-map').should('be.visible')
    cy.getByData('parking-info').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('billyWilderTheaterpage')
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
    cy.visit('/billy-wilder-theater')
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
    describe(`Billy Wilder Theater Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runBillyWilderTests({ withSnapshot: true })
    })
  })
} else {
  describe('Billy Wilder Theater Page', () => {
    runBillyWilderTests({ withSnapshot: false })
  })
}
