import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runBasicCollectionDetailTest({ withSnapshot = false } = {}) {
  it('Visits a Basic Collection Detail Page', () => {
    cy.visit('/collections/test-get-used-to-it')
    cy.getByData('breadcrumb').should('be.visible')

    // page-collection-detail wrapper should exist on basic layouts
    cy.get('.page-collection-detail').should('exist')

    // sharebutton should exist
    cy.getByData('share-button').should('exist')

    // cta should be in sidebar
    cy.getByData('sidebar-cta').should('exist')

    if (withSnapshot) {
      cy.visualSnapshot('collectiondetailpage')
    }
  })
}

function runListOfItemsCollectionDetailTest({ withSnapshot = false } = {}) {
  it('Visits a List of Items Collection Detail Page', () => {
    cy.visit('/collections/ktla-newsfilm-collection')
    cy.getByData('breadcrumb').should('be.visible')

    // page-collections-list-of-items wrapper should exist on list of items layouts
    cy.get('.page-collections-list-of-items').should('exist')

    if (withSnapshot) {
      cy.visualSnapshot('complexcollectionpage')
    }
  })
}

function runAllCollectionDetailTests({ withSnapshot = false } = {}) {
  runBasicCollectionDetailTest({ withSnapshot })
  runListOfItemsCollectionDetailTest({ withSnapshot })
}

// ---- Chromatic: loop viewports using describe config (NO cy.viewport) ----
if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Collection Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runAllCollectionDetailTests({ withSnapshot: true })
    })
  })
}

// ---- Percy: single run + snapshot ----
else if (isPercy) {
  describe('Collection Detail Page', () => {
    runAllCollectionDetailTests({ withSnapshot: true })
  })
}

// ---- Local: no snapshots ----
else {
  describe('Collection Detail Page', () => {
    runAllCollectionDetailTests({ withSnapshot: false })
  })
}
