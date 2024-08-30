Cypress.on('uncaught:exception', () => { return false })

describe('Event Detail page', () => {
  // context('breadcrumb', () => {
  //   // NavBreadcrumb
  //   it('has a breadcrumb nav with the correct title', () => {
  //     cy.wait(1000)
  //     cy.getByData('breadcrumb').contains('TEST - La Région Centrale')
  //   })
  // })

  it('Visit the Event Detail Page', () => {
    // CarouselImages
    cy.visit('/events/la-région-centrale-03-08-24')
    cy.getByData('image-carousel').should('exist')
    cy.getByData('text-block').contains('TEST - La Région Centrale Screening')
    cy.getByData('text-block').should('be.visible')
    cy.getByData('event-description').should('be.visible')
    cy.getByData('acknowledgements').should('be.visible')
    cy.getByData('screening-details').should('be.visible')
    cy.get('.block-event-detail.ftva').scrollIntoView()
    cy.get('.block-event-detail.ftva').should('be.visible')
    cy.getByData('calendar-dropdown').should('exist')
    cy.getByData('ticket-info').should('be.visible')
    cy.getByData('event-series').should('be.visible')
    cy.percySnapshot('eventdetailpage', { widths: [768, 992, 1200] })

    // it('clicks the arrow to see the next image', () => {
    //   cy.getByData('screening-details').contains('Trailer with Cover image')
    // })
  })
  // modal exists
  // two images
  // creditText is visible .contains('Movie Database')
  // click on arrow and it moves to next image
  // cy.getByData("ticket-info").find("a").contains("Plan Your Visit").click()
})

// Potential TODOs and test ideas
// https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test
// it.only('allows users to subscribe to the email list', () => {
//   cy.getByData('email-input').type('human@gmail.com')
//   cy.getByData('submit-button').click()
//   cy.getByData('success-message').should('exist').contains('human@gmail.com')
// })

// UI Elements: Test visibility and functionality of important UI elements (e.g., buttons, links, modals)

// Verify that data is displayed correctly, especially dynamic data fetched from APIs

// Event Information Display: Ensure that all event details (title, description, date, time, location) are displayed correctly

// Add to Calendar: Verify that the "Add to Calendar" button works as expected

// Responsive Design: Check that the page renders correctly on different screen sizes

// Navigation: Ensure that navigation to and from the event detail page works smoothly

// ---------

// UI Elements: Test visibility and functionality of important UI elements (e.g., buttons, links, modals)

// Verify that data is displayed correctly, especially dynamic data fetched from APIs

// Event Information Display: Ensure that all event details (title, description, date, time, location) are displayed correctly

// Add to Calendar: Verify that the "Add to Calendar" button works as expected

// Responsive Design: Check that the page renders correctly on different screen sizes

// Navigation: Ensure that navigation to and from the event detail page works smoothly
