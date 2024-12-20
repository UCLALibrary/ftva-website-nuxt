Cypress.on('uncaught:exception', () => { return false })

describe('Events Listing page', () => {
  it('Visits Events Listing page', () => {
    cy.visit('/events')

    cy.getByData('date-filter').should('be.visible')

    cy.getByData('filters-dropdown').should('be.visible')

    cy.getByData('tabbed-content').should('be.visible')

    cy.percySnapshot('eventslistpage', { widths: [768, 992, 1200] })
  })
})

describe('Events Listing page', () => {
  it('Toggles tab to calendar view', () => {
    // Calendar is only visit at 1025px and above
    cy.viewport(1280, 720)

    cy.visit('/events')

    cy.get('.tab-list-header').should('be.visible')

    cy.get('[data-test="list-view"]').should('be.visible')

    cy.getByData('tabbed-content').should('be.visible')

    cy.get('#tab-calendar-view').click()

    cy.get('[data-test="calendar-view"]').should('be.visible')
  })
})

// ToDo: Additional UI tests
// DateFilter & FilterDropdown interactions:
// Select date range
// Select filters
