Cypress.on('uncaught:exception', () => { return false })

describe('Events Listing page', () => {
  beforeEach(() => {
    cy.visit('/events')
  })

  it('Visits Events Listing page', () => {
    cy.getByData('date-filter').should('be.visible')

    cy.getByData('filters-dropdown').should('be.visible')

    cy.getByData('tabbed-content').should('be.visible')

    cy.percySnapshot('eventslistpage')
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

  it('Shows events within selected date and clears date filters', { scrollBehavior: false }, () => {
    // Intercept all Elasticsearch search calls
    cy.intercept({ method: 'POST', url: '**/_search' }).as('eventData')

    // Visit the page
    cy.visit('/events')

    // Wait for initial data to load (2 calls expected)
    cy.wait('@eventData')
    cy.wait('@eventData')

    // Scroll to date filter
    cy.getByData('date-filter').scrollIntoView({ offset: { top: -150, left: 0 } })

    // Ensure date filter is ready for input
    cy.getByData('date-filter').should('not.be.disabled')

    // Type the date
    cy.getByData('date-filter').type('12/01/2024', { waitforAnimations: true })

    // Click "Apply" (select-button)
    cy.get('.select-button').click()

    // Wait for filtered data to load
    cy.wait('@eventData')

    // Assert that exactly 1 event shows up
    cy.get('.list li', { timeout: 10000 }).should('have.length', 1)
    cy.get('.block-card-three-column').contains('Mother India')

    // Click "remove filter" button
    cy.get('.block-remove-search-filter').click()

    // Wait for unfiltered data to reload
    cy.wait('@eventData')
    cy.wait('@eventData')

    // Assert that multiple events are displayed
    cy.get('.list li', { timeout: 10000 }).should('have.length.above', 5)
  })

  it('Shows events with selected labels and clears label filters', () => {
    // wait for 2 fetch calls until list is visible to ensure initial render has finished
    cy.viewport(375, 750) // ensure list view

    cy.intercept('POST', '**/_search*').as('eventData')

    cy.wait('@eventData')
    cy.wait('@eventData')

    cy.getByData('filters-dropdown').click()
    cy.get('.pill-label').contains('35mm').first().click()
    cy.get('.select-button').click()

    cy.wait('@eventData') // wait for filtered results

    cy.get('.list li').should('have.length.below', 8)
  })
})
