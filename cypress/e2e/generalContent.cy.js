import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runGeneralContentTests({ withSnapshot = false } = {}) {
  it('Visit a General Content Page', () => {
    cy.visit('/about')

    if (withSnapshot) {
      cy.visualSnapshot('generalContentPage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`General Content Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runGeneralContentTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('General Content Page', () => {
    runGeneralContentTests({ withSnapshot: true })
  })
} else {
  describe('General Content Page', () => {
    runGeneralContentTests({ withSnapshot: false })
  })
}
