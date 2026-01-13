// Currently exists only for LA Rebellion
describe('Collection Filmmakers Listing Page', () => {
  it('Visits the `L.A. Rebellion` Filmmakers Listing page', () => {
    cy.visit('/collections/la-rebellion/filmmakers')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('page-listings').should('be.visible')
    visualSnapshot('collectionFilmmakersListPage')
  })
})
