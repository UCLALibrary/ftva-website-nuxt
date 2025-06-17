describe('Search Page', () => {
  it('Visits the Search page', () => {
    cy.visit('/search')

    cy.percySnapshot('searchpage', { widths: [768, 992, 1200] })
  })
})
