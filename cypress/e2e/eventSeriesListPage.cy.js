import { a11yIt } from '../support/a11y'
import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runEventSeriesListTests({ withSnapshot = false } = {}) {
  it('Visits the Event Series List page', () => {
    cy.visit('/series')

    if (withSnapshot) {
      cy.visualSnapshot('eventserieslistpage')
    }
  })

  a11yIt('/series')
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Event Series List Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runEventSeriesListTests({ withSnapshot: true })
    })
  })
} else {
  describe('Event Series List Page', () => {
    runEventSeriesListTests({ withSnapshot: false })
  })
}
