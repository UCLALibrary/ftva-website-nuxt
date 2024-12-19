describe('Events Listing page', () => {
  it('Visits the Events Listing page', () => {
    cy.visit('/events')

    cy.getByData('date-filter').should('be.visible')

    cy.getByData('filters-dropdown').should('be.visible')

    cy.getByData('tab-content').should('be.visible')

    cy.percySnapshot('eventslistpage', { widths: [768, 992, 1200] })
  })
})
