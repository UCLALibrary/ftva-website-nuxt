Cypress.on('uncaught:exception', () => { return false })

describe('Event Detail page', () => {
  beforeEach(() => {
    cy.visit('/events/la-r%C3%A9gion-centrale-03-08-24')
  })

  // context('breadcrumb', () => {
  //   // NavBreadcrumb
  //   it('has a breadcrumb nav with the correct title', () => {
  //     cy.wait(1000)
  //     cy.getByData('breadcrumb').contains('TEST - La Région Centrale')
  //   })
  // })

  context('imageCarousel-banner', () => {
    // CarouselImages
    it('has multiple images in the imageCarousel', () => {
      cy.getByData('image-carousel').should('exist')
    })
    // it('clicks the arrow to see the next image', () => {
    //   cy.getByData('screening-details').contains('Trailer with Cover image')
    // })
  })
  // modal exists
  // two images
  // creditText is visible .contains('Movie Database')
  // click on arrow and it moves to next image
  // cy.getByData("ticket-info").find("a").contains("Plan Your Visit").click()

  context('Metablock', () => {
    // CardMeta
    // cy.get("dt").eq(0).contains("4 courses")
    it('metablock has a Category', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })

    it('metablock has a Title', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })

    it('metablock has a Guest Speaker', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })

    it('metablock has TagLabels', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })

    it('metablock has an Introduction', () => {
      cy.getByData('text-block').contains('Guest Speaker Graeme Ferguson')
    })
  })

  context('EventDescription', () => {
    // RichText - EventDescription
    it('has an event description', () => {
      cy.getByData('event-description').contains('The late avant-garde master Michael Snow')
    })
  })

  context('Acknowledgements', () => {
    // RichText - Acknowledgements
    it('has an acknowledgement', () => {
      cy.getByData('acknowledgements').contains('Special thanks to our community partner')
    })
  })

  context('Section Screening Details', () => {
    it('has a category', () => {
      cy.getByData('screening-details').contains('Screening 1 of 5')
    })
    it('has a title', () => {
      cy.getByData('screening-details').contains('Trailer with Cover image')
    })
    it('has the Year', () => {
      cy.getByData('screening-details').contains('Year 2025')
    })
    it('has the Country', () => {
      cy.getByData('screening-details').contains('Country South Country')
    })
    it('has the Language', () => {
      cy.getByData('screening-details').contains('Language Spanglish')
    })
    it('has the Runtime', () => {
      cy.getByData('screening-details').contains('Runtime 190 minutes')
    })
    it('has Tag Labels', () => {
      cy.getByData('screening-details').contains('IMAX')
    })
    it('has Tag Labels', () => {
      cy.getByData('screening-details').contains('Experimental Film')
    })
    it('has a Description', () => {
      cy.getByData('screening-details').contains('MICHAEL SNOW’S 1970–71 FILM La Région Centrale')
    })
    // it('has a Trailer', () => {
    //   cy.getByData('screening-details').contains('La Région Centrale is three long hours')
    // })
  })

  // SIDEBAR / DETAILS
  context('BlockEventDetail', () => {
    // BlockEventDetail
    it('has an event date', () => {
      cy.getByData('event-details').contains('March 8, 2027')
    })
    it('has an event time', () => {
      cy.getByData('event-details').contains('7:30 pm')
    })
    it('has an event location', () => {
      cy.getByData('event-details').contains('Billy Wilder Theater')
    })
  })

  // context('Calendar Dropdown', () => {
  //   it.only('has a calendar dropdown', () => {
  //     cy.wait(1000)
  //     cy.getByData('calendar-dropdown').contains('Add to Calendar')
  //   })
  // })

  context('BlockInfo/ Ticket Info', () => {
    it('has ticket information admission', () => {
      cy.getByData('ticket-info').contains('Admission is free')
    })
    it('has ticket information seats', () => {
      cy.getByData('ticket-info').contains('Your seat will be assigned to you when you pick up your ticket at the box office')
    })
    // Button
    it('has a button', () => {
      cy.getByData('ticket-info').contains('Plan Your Visit')
    })
  })

  // Upcoming Events (Bottom of Page)
  context('Related EventSeries', () => {
    it('has event series title', () => {
      cy.getByData('event-series').contains('Wavelength')
    })
    it('has event series date & time', () => {
      cy.getByData('event-series').contains('Sep 16, 2027')
    })
    it('has event series title', () => {
      cy.getByData('event-series').click()
    })
  })

  context('footer', () => {
    it('has the Footer', () => {
      cy.getByData('footer').contains('Stay updated')
    })
    it('has the Footer Links', () => {
      cy.getByData('footer').contains('About the Archive')
    })
    it('has the Footer Sock', () => {
      cy.getByData('footer').contains('© 2024 Regents of the University of California')
    })
  })
})

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
