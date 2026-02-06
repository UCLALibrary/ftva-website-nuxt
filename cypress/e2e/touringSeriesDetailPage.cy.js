import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runTouringSeriesDetailTests({ withSnapshot = false } = {}) {
  it('Visit the Touring Series detail page', () => {
    cy.visit('/touring-series/through-indian-eyes-native-american-cinema')

    if (withSnapshot) {
      cy.visualSnapshot('touringseriesdetailpage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Touring Series Detail Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runTouringSeriesDetailTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Touring Series Detail Page', () => {
    runTouringSeriesDetailTests({ withSnapshot: true })
  })
} else {
  describe('Touring Series Detail Page', () => {
    runTouringSeriesDetailTests({ withSnapshot: false })
  })
}
