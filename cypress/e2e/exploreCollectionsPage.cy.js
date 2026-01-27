import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runExploreCollectionsTests({ withSnapshot = false } = {}) {
  it('Visits the Explore Collections page', () => {
    cy.visit('/collections')

    cy.getByData('page-heading').should('be.visible')
    cy.getByData('page-description').should('be.visible')
    cy.getByData('featured-collection').should('be.visible')
    cy.getByData('hearst-collection').should('be.visible')
    cy.getByData('other-resources').should('be.visible')
    cy.getByData('about-collections').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('exploreCollectionsPage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Explore Collections Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runExploreCollectionsTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Explore Collections Page', () => {
    runExploreCollectionsTests({ withSnapshot: true })
  })
} else {
  describe('Explore Collections Page', () => {
    runExploreCollectionsTests({ withSnapshot: false })
  })
}
