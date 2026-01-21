import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runSearchPageTests({ withSnapshot = false } = {}) {
  it('Visits the Search page', () => {
    cy.visit('/search?q=family')
    cy.get('span.search-keywords').should('contain', 'family')
    cy.get('.sort-and-results').should('be.visible')
    cy.get('.sidebar').should('be.visible')
    cy.get('.section-pagination').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('searchpage')
    }
  })
// ✅ Only run this locally (not Percy/Chromatic)
  if (!isChromatic && !isPercy) {
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
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Search Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runSearchPageTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Search Page', () => {
    runSearchPageTests({ withSnapshot: true })
  })
} else {
  describe('Search Page', () => {
    runSearchPageTests({ withSnapshot: false })
  })
}
