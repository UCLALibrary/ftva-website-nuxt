import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => false)

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runCollectionListingTests({ withSnapshot = false } = {}) {
  beforeEach(() => {
    cy.visit('/collections/motion-picture', { failOnStatusCode: false })
  })

  it('Visits a Collection Listing Page', () => {
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-title').should('exist')
    cy.getByData('collection-browse').should('exist')

    if (withSnapshot) cy.visualSnapshot('collectionlistingpage')
  })

  // ✅ Only run this locally (not Percy/Chromatic)
  if (!isChromatic) {
    it('Browses by A and shows at least one collection item/card', () => {
      cy.getByData('collection-browse').contains('A').click()
      cy.getByData('collection-list').find('.card').should('have.length.above', 1)
    })
  }

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('collections/motion-picture', { failOnStatusCode: false })
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
    describe(`Collection Listing Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionListingTests({ withSnapshot: true })
    })
  })
} else {
  describe('Collection Listing Page', () => {
    runCollectionListingTests({ withSnapshot: false })
  })
}
