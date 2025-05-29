describe('Collection Filmography List Page', () => {
  it('Visits the `L.A. Rebellion` Filmography', () => {
    cy.visit('/collections/la-rebellion/filmography')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByClass('page-collections-list-of-items').should('be.visible')
  })

  it('Visits the `In The Life` Filmography', () => {
    cy.visit('/collections/in-the-life/filmography')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByClass('page-collections-list-of-items').should('be.visible')
  })
})
