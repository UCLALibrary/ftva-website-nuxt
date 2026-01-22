import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => false)

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

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
  if (!isChromatic && !isPercy) {
    it('Browses by A and shows at least one collection item/card', () => {
      cy.getByData('collection-browse').contains('A').click()
      cy.getByData('collection-list').find('.card').should('have.length.above', 1)
    })
  }
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Collection Listing Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionListingTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Collection Listing Page', () => {
    runCollectionListingTests({ withSnapshot: true })
  })
} else {
  describe('Collection Listing Page', () => {
    runCollectionListingTests({ withSnapshot: false })
  })
}
