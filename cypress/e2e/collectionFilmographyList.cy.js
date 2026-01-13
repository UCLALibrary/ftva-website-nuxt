// The filmography route only exists for 2 collections
describe('Collection Filmography List Page', () => {
  it('Visits the `L.A. Rebellion` Filmography', () => {
    cy.visit('/collections/la-rebellion/filmography')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('complex-collections-page-title').should('be.visible')
    cy.visualSnapshot('collectionFilmographyListPage')
  })

  it('Visits the `In The Life` Filmography', () => {
    cy.visit('/collections/in-the-life/episodes')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('complex-collections-page-title').should('be.visible')
  })
})
