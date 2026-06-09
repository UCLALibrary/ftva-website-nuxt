import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runEventSeriesDetailTests({ withSnapshot = false } = {}) {
  it('Visits the Event Series Detail page', () => {
    cy.visit('/series/step-up-series')

    if (withSnapshot) {
      cy.visualSnapshot('eventseriesdetailpage')
    }
  })

  // TODO: below test is failing, reenable when LADI-5229 is fixed
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  // it('has no accessibility violations', {
  //   retries: {
  //     runMode: 0,
  //     openMode: 0,
  //   },
  // }, () => {
  //   cy.visit('/series/step-up-series', { failOnStatusCode: false })
  //   cy.injectAxe()
  //   // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
  //   cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
  //     violations.forEach((violation) => {
  //       cy.log(`Accessibility Violation: ${violation.id} ${violation.impact}
  //       Description: ${violation.description}
  //       Help: ${violation.help} ${violation.helpUrl}
  //       HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
  //     })
  //   })
  // })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Event Series Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runEventSeriesDetailTests({ withSnapshot: true })
    })
  })
} else {
  describe('Event Series Detail Page', () => {
    runEventSeriesDetailTests({ withSnapshot: false })
  })
}
