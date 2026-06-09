import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => { return false })

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runEventDetailTests({ withSnapshot = false } = {}) {
  it('Visit the Event Detail Page', () => {
    // CarouselImages
    cy.visit('/events/la-région-centrale-03-08-24', { failOnStatusCode: false })
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
    cy.visualSnapshot('eventdetailpage')
  })

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/events/la-région-centrale-03-08-24', { failOnStatusCode: false })
    cy.injectAxe()
    // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
    cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id} ${violation.impact} 
        Description: ${violation.description} 
        Help: ${violation.help} ${violation.helpUrl} 
        HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
      })
    })
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Event Detail page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runEventDetailTests({ withSnapshot: true })
    })
  })
} else {
  describe('Event Detail page', () => {
    runEventDetailTests({ withSnapshot: false })
  })
}

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
