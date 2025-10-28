describe('Search Page', () => {
  it('Visits the Search page', () => {
    cy.visit('/search?q=family')
    cy.get('span.search-keywords').should('contain', 'family')
    cy.get('.sort-and-results').should('be.visible')
    cy.get('.sidebar').should('be.visible')
    cy.get('.section-pagination').should('be.visible')
    cy.percySnapshot('searchpage')
  })
  it('Search blank', () => {
    cy.visit('/search')
    cy.get('.no-results .no-results-title').should('contain', 'No results found.')
    cy.get('.no-results .no-results-text').should('contain', 'Looking for a specific collection item? Search the UCLA Film & Television Archive Catalog at UC Library Search')
    cy.get('a.button-link > span').should('contain', 'UC Library Search')
  })
})
