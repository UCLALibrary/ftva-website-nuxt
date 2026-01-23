import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runEventSeriesDetailTests({ withSnapshot = false } = {}) {
  it('Visits the Event Series Detail page', () => {
    cy.visit('/series/step-up-series')

    if (withSnapshot) {
      cy.visualSnapshot('eventseriesdetailpage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Event Series Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runEventSeriesDetailTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Event Series Detail Page', () => {
    runEventSeriesDetailTests({ withSnapshot: true })
  })
} else {
  describe('Event Series Detail Page', () => {
    runEventSeriesDetailTests({ withSnapshot: false })
  })
}
