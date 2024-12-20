describe('Events Listing page', () => {
  it('Visits Events Listing page', () => {
    cy.visit('/events')

    cy.getByData('date-filter').should('be.visible')

    cy.getByData('filters-dropdown').should('be.visible')

    cy.getByData('tabbed-content').should('be.visible')

    cy.percySnapshot('eventslistpage', { widths: [768, 992, 1200] })
  })
})

// Sample UI test

describe('Events Listing page', () => {
  it('Tests tab toggle to calendar view', () => {
    cy.viewport(1280, 720)

    cy.visit('/events')

    cy.get('.tab-list-header').should('be.visible')

    cy.get('#tab-calendar-view').click()

    cy.getByData('calendar-view').should('be.visible')
  })
})
