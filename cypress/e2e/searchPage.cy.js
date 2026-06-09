import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runSearchPageTests({ withSnapshot = false, label = 'Desktop' } = {}) {
  it('Visits the Search page', () => {
    cy.visit('/search?q=family')
    if (label === 'Desktop') {
      cy.get('span.search-keywords').should('contain', 'family')
      cy.get('.sort-and-results').should('be.visible')
      cy.get('.sidebar').should('be.visible')
      cy.get('.section-pagination').should('be.visible')
    }

    if (withSnapshot) {
      cy.visualSnapshot('searchpage')
    }
  })
  // ✅ Only run this locally (not Percy/Chromatic)
  if (!isChromatic) {
    it('Search blank', () => {
      cy.visit('/search')
      cy.get('.no-results .no-results-title').should('contain', 'No results found.')
      cy.get('.no-results .no-results-text').should(
        'contain',
        'Looking for a specific collection item? Search the UCLA Film & Television Archive Catalog at UC Library Search'
      )
      cy.get('a.button-link > span').should('contain', 'UC Library Search')
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
    cy.visit('/search?q=family', { failOnStatusCode: false })
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
    describe(`Search Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runSearchPageTests({ withSnapshot: true, label: `${label}` })
    })
  })
} else {
  describe('Search Page', () => {
    runSearchPageTests({ withSnapshot: false })
  })
}
