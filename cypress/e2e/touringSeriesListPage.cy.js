Cypress.on('uncaught:exception', () => { return false })

describe('Touring Series List page', () => {
  it('Visits the Touring Series List page', () => {
    cy.visit('/touring-series')

    cy.get('[data-test="page-heading"]').should('be.visible')

    cy.get('[data-test="tab-toggle"]').should('be.visible')

    cy.get('[data-test="tabbed-content"]').should('be.visible')

    cy.visualSnapshot('touringserieslistpage')
  })
})
