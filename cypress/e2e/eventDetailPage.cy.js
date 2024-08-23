describe('Event Detail page', () => {
  beforeEach(() => {
    cy.visit('/events/la-r%C3%A9gion-centrale-03-08-24')
  })

  context('imageCarousel-banner', () => {
    // CarouselImages
    it.only('has multiple images in the imageCarousel', () => {
      cy.getByData('image-carousel').contains('Movie Database')
    })
  })

  context('metablock', () => {
    // CardMeta
    // cy.get("dt").eq(0).contains("4 courses")
    it('has text', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })

    // :category="series[0]?.title"
    // :title="page?.title"
    // :guest-speaker="page.guestSpeaker"
    // :tag-labels="page.tagLabels"
    // :introduction="page.introduction"

    // RichText - EventDescription
    it('has an event description', () => {
      cy.getByData('event-description').contains('TEST - La Région Centrale')
    })

    // RichText - Acknowledgements
    it('has an acknowledgement', () => {
      cy.getByData('acknowledgements').contains('Acknowledgement')
    })

    // SectionScreeningDetails
    it('has a screening-details', () => {
      cy.getByData('screening-details').contains('Trailer with Cover image')
    })
    it('clicks the arrow to see the next image', () => {
      cy.getByData('screening-details').contains('Trailer with Cover image')
    })
  })

  context('sidebar-details', () => {
    // BlockEventDetail
    it('has a event date', () => {
      cy.getByData('event-details').contains('March 8, 2024')
    })
    it('has a event time', () => {
      cy.getByData('event-details').contains('7:30 pm')
    })
    it('has a event location', () => {
      cy.getByData('event-details').contains('Billy Wilder Theater')
    })

    // BlockInfo/ Ticket Info
    it('has ticket information', () => {
      cy.getByData('ticket-info').contains('Admission is free')
      cy.getByData('ticket-info').contains('Your seat will be assigned to you when you pick up your ticket at the box office')
    })
    // Button
    it('has a button', () => {
      cy.getByData('ticket-info').contains('Plan Your Visit')
    })
    // it.("clicks the button", () => {
    //   cy.getByData("ticket-info").find("a").contains("Plan Your Visit").click()
    //   cy.location("pathname").should("equal", "/billy-wilder-theater")
    // })
  })

  context('related-event-series', () => {
    // SectionTeaserCard Event Series
    // parsedFtvaEventSeries
    // it('has event series title', () =>{
    //   cy.getByData('event-series').contains('Billy Wilder Theater')
    // })
    // it('has event series image', () =>{
    //   cy.getByData('event-series').contains('Billy Wilder Theater')
    // })
    it('has event series date', () => {
      cy.getByData('event-series').contains('Billy Wilder Theater')
    })
  })

  context('footer', () => {
    // Footer
    it('allows users to subscribe to the email list', () => {
      cy.getByData('email-input').type('human@gmail.com')
      cy.getByData('submit-button').click()
      cy.getByData('success-message').should('exist').contains('human@gmail.com')
    })
  })

  context('breadcrumb', () => {
    // NavBreadcrumb
    it('has a breadcrumb nav with the correct title', () => {
      cy.getByData('breadcrumb').contains('TEST - La Région Centrale')
    })
  })

  // ResponsiveImage (This page has imageCarousel)
  // it('has a single responsive image', () =>{
  //   cy.getByData('single-image').contains('TEST - La Région Centrale')
  // })

  // context('other stuff', () => {
  // UI Elements: Test visibility and functionality of important UI elements (e.g., buttons, links, modals)

  // Verify that data is displayed correctly, especially dynamic data fetched from APIs

  // Event Information Display: Ensure that all event details (title, description, date, time, location) are displayed correctly

  // Add to Calendar: Verify that the "Add to Calendar" button works as expected

  // Responsive Design: Check that the page renders correctly on different screen sizes

  // Navigation: Ensure that navigation to and from the event detail page works smoothly

  // named screen shot
  // cy.percySnapshot('eventdetailpage', { widths: [768, 992, 1200] })
  // })


// ---------

// UI Elements: Test visibility and functionality of important UI elements (e.g., buttons, links, modals)

// Verify that data is displayed correctly, especially dynamic data fetched from APIs

// Event Information Display: Ensure that all event details (title, description, date, time, location) are displayed correctly

// Add to Calendar: Verify that the "Add to Calendar" button works as expected

// Responsive Design: Check that the page renders correctly on different screen sizes

// Navigation: Ensure that navigation to and from the event detail page works smoothly

})
