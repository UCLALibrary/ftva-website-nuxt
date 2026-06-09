import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runCollectionItemDetailTests({ withSnapshot = false } = {}) {
  it('Visits a Collection Item Detail Page', () => {
    cy.visit('/collections/ktla-newsfilm-collection/african-american-william-c-taylor-of-the-communist-party-to-run-for-los-angeles-county-supervisor')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-title').should('be.visible')
    cy.getByData('metadata').should('be.visible')
    cy.getByData('related-content').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('collectionitemdetailpage')
  })

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/collections/ktla-newsfilm-collection/african-american-william-c-taylor-of-the-communist-party-to-run-for-los-angeles-county-supervisor', { failOnStatusCode: false })
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
    describe(`Collection Item Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionItemDetailTests({ withSnapshot: true })
    })
  })
} else {
  describe('Collection Item Detail Page', () => {
    runCollectionItemDetailTests({ withSnapshot: false })
  })
}
