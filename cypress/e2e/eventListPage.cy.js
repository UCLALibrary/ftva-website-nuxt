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

  it('Shows events within selected date and clears date filters', { scrollBehavior: false }, () => {
    // wait for 2 fetch calls until list is visible to ensure initial render has finished
    cy.intercept({ method: 'POST', url: '**/_search' }).as('eventData')
    cy.wait('@eventData').wait('@eventData').then(() => {
      cy.getByData('date-filter').scrollIntoView({ offset: { top: -150, left: 0 } }) // scroll to date filter before typing to prevent errors with sticky header
      /* eslint-disable cypress/no-unnecessary-waiting */
      cy.wait(1000) // wait for scroll to finish, field is briefly disabled
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

  it('Shows events with selected labels and clears label filters', () => {
    // wait for 2 fetch calls until list is visible to ensure initial render has finished
    cy.viewport(375, 812)
    cy.visit('/events?view=list')
    cy.intercept({ method: 'POST', url: '**/_search' }).as('eventData')
    cy.wait('@eventData').wait('@eventData').then(() => {
      cy.getByData('filters-dropdown').click()
      cy.get('.pill-label').contains('35mm').first().click()
      cy.get('.select-button').click()
      // expect fewer than 8 items than match both
      cy.get('.list').find('li').should('have.length.below', 8)
    })
  })
})
