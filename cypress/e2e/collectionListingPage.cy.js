Cypress.on('uncaught:exception', () => { return false })

describe('Collection Listing Page', () => {
  beforeEach(() => {
    cy.visit('/collections/motion-picture', { failOnStatusCode: false })
  })

  it('Visits a Collection Listing Page', () => {
    cy.getByData('breadcrumb').should('be.visible')

    cy.getByData('page-title').should('exist')

    cy.getByData('collection-browse').should('exist')

    visualSnapshot('collectionlistingpage')
  })

  it('Browses by A and shows at least one collection item/card', () => {
    cy.getByData('collection-browse').contains('A').click()

    cy.getByData('collection-list').find('.card').should('have.length.above', 1)
  })
})
