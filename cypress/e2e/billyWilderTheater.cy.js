import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

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
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Billy Wilder Theater Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runBillyWilderTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Billy Wilder Theater Page', () => {
    runBillyWilderTests({ withSnapshot: true })
  })
} else {
  describe('Billy Wilder Theater Page', () => {
    runBillyWilderTests({ withSnapshot: false })
  })
}
