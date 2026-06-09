import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

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

  // TODO: below test is failing, reenable when LADI-5228 is fixed
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  // it('has no accessibility violations', {
  //   retries: {
  //     runMode: 0,
  //     openMode: 0,
  //   },
  // }, () => {
  //   cy.visit('/collections', { failOnStatusCode: false })
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
    describe(`Explore Collections Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runExploreCollectionsTests({ withSnapshot: true })
    })
  })
} else {
  describe('Explore Collections Page', () => {
    runExploreCollectionsTests({ withSnapshot: false })
  })
}
