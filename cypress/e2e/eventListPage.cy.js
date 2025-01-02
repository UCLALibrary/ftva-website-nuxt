Cypress.on('uncaught:exception', () => { return false })

describe('Events Listing page', () => {
  beforeEach(() => {
    cy.visit('/events')
  })

  it('Visits Events Listing page', () => {
    cy.getByData('date-filter').should('be.visible')

    cy.getByData('filters-dropdown').should('be.visible')

    cy.getByData('tabbed-content').should('be.visible')

    cy.percySnapshot('eventslistpage', { widths: [768, 992, 1200] })
  })

  it('Toggles tab to calendar view', () => {
    // Calendar is visible at 1025px and above
    cy.viewport(1280, 720)

    cy.get('.tab-list-header').should('be.visible')

    cy.get('[data-test="list-view"]').should('be.visible')

    cy.get('[data-test="tabbed-content"]').should('be.visible')

    cy.get('#tab-calendar-view').click()

    cy.get('[data-test="calendar-view"]').should('be.visible')
  })

  it('Shows events within selected date and clears filters', { scrollBehavior: false }, () => {
    // wait for 2 fetch calls until list is visible to ensure initial render has finished
    cy.intercept({ method: 'POST', url: '**/_search' }).as('eventData')
    cy.wait('@eventData').wait('@eventData').then(() => {
      cy.get('.block-card-three-column').should('be.visible')
      cy.getByData('date-filter').type('12/01/2024', { waitforAnimations: true })
      cy.get('.select-button').click()
      // expect 1 item rendered with title Mother India
      cy.get('.list').find('li').should('have.length', 1)
      cy.get('.block-card-three-column').contains('Mother India')
    })

    // click filter to remove and check list is unfiltered
    cy.get('.block-remove-search-filter').click()
    cy.then(() => {
      cy.get('.list').find('li').should('have.length.above', 5)
    })
  })
})
