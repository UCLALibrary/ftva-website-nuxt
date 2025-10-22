Cypress.on('uncaught:exception', () => { return false })

describe('Touring Series List page', () => {
  it('Visits the Touring Series List page', () => {
    cy.visit('/touring-series')

    cy.get('[data-test="past-series-view"]').should('be.visible')

    cy.get('[data-test="tabbed-past-content"]').should('be.visible')

    cy.percySnapshot('touringserieslistpage', { widths: [768, 992, 1200] })
  })
})
