import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runCollectionFilmmakersListingTest({ withSnapshot = false } = {}) {
  it('Visits the `L.A. Rebellion` Filmmakers Listing page', () => {
    cy.visit('/collections/la-rebellion/filmmakers')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('page-listings').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('collectionFilmmakersListPage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Collection Filmmakers Listing Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionFilmmakersListingTest({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Collection Filmmakers Listing Page', () => {
    runCollectionFilmmakersListingTest({ withSnapshot: true })
  })
} else {
  describe('Collection Filmmakers Listing Page', () => {
    runCollectionFilmmakersListingTest({ withSnapshot: false })
  })
}
