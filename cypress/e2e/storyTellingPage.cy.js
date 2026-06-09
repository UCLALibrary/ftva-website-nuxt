import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => { return false })

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runStoryTellingTests({ withSnapshot = false } = {}) {
  it('Visits the L.A. Rebellion StoryTelling Page', () => {
    cy.visit('/collections/la-rebellion')

    cy.getByData('main-image').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('flexible-blocks-content').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('storyTellingPage')
    }
  })

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/collections/la-rebellion', { failOnStatusCode: false })
    cy.injectAxe()
    // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
    cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id} ${violation.impact} 
        Description: ${violation.description} 
        Help: ${violation.help} ${violation.helpUrl} 
        HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
      })
    })
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Complex Collection StoryTelling Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runStoryTellingTests({ withSnapshot: true })
    })
  })
} else {
  describe('Complex Collection StoryTelling Page', () => {
    runStoryTellingTests({ withSnapshot: false })
  })
}
