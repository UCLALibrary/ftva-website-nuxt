import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runCollectionItemDetailTests({ withSnapshot = false } = {}) {
  it('Visits a Collection Item Detail Page', () => {
    cy.visit('/collections/ktla-newsfilm-collection/african-american-william-c-taylor-of-the-communist-party-to-run-for-los-angeles-county-supervisor')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-title').should('be.visible')
    cy.getByData('metadata').should('be.visible')
    cy.getByData('related-content').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('collectionitemdetailpage')
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Collection Item Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionItemDetailTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Collection Item Detail Page', () => {
    runCollectionItemDetailTests({ withSnapshot: true })
  })
} else {
  describe('Collection Item Detail Page', () => {
    runCollectionItemDetailTests({ withSnapshot: false })
  })
}
