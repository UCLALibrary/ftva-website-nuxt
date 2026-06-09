import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runCollectionFilmographyTests({ withSnapshot = false } = {}) {
  it('Visits the `L.A. Rebellion` Filmography', () => {
    cy.visit('/collections/la-rebellion/filmography')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('complex-collections-page-title').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('collectionFilmographyListPage')
  })
  // ✅ Only define this test locally or CI cypress (not Percy, not Chromatic)
  if (!isChromatic) {
    it('Visits the `In The Life` Filmography', () => {
      cy.visit('/collections/in-the-life/episodes')
      cy.getByData('breadcrumb').should('be.visible')
      cy.getByData('complex-collections-page-title').should('be.visible')
    })
  }

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/collections/la-rebellion/filmography', { failOnStatusCode: false })
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
    describe(`Collection Filmography List Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runCollectionFilmographyTests({ withSnapshot: true })
    })
  })
} else {
  describe('Collection Filmography List Page', () => {
    runCollectionFilmographyTests({ withSnapshot: false })
  })
}
