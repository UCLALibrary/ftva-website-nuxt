Cypress.on('uncaught:exception', () => { return false })

import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

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
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Touring Series List Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runTouringSeriesListTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Touring Series List Page', () => {
    runTouringSeriesListTests({ withSnapshot: true })
  })
} else {
  describe('Touring Series List Page', () => {
    runTouringSeriesListTests({ withSnapshot: false })
  })
}

