import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runCollectionFilmographyTests({ withSnapshot = false } = {}) {
  it('Visits the `L.A. Rebellion` Filmography', () => {
    cy.visit('/collections/la-rebellion/filmography')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('complex-collections-page-title').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('collectionFilmographyListPage')
  })
  // ✅ Only define this test locally or CI cypress (not Percy, not Chromatic)
  if (!isChromatic && !isPercy) {
    it('Visits the `In The Life` Filmography', () => {
      cy.visit('/collections/in-the-life/episodes')
      cy.getByData('breadcrumb').should('be.visible')
      cy.getByData('complex-collections-page-title').should('be.visible')
    })
  }
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Collection Filmography List Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionFilmographyTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Collection Filmography List Page', () => {
    runCollectionFilmographyTests({ withSnapshot: true })
  })
} else {
  describe('Collection Filmography List Page', () => {
    runCollectionFilmographyTests({ withSnapshot: false })
  })
}
