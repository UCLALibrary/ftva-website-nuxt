describe('Event Detail page', () => {
  it('Visit a event Detail Page', () => {
    cy.visit('/events/la-région-centrale-03-08-24')

    cy.get('h3.title-no-link').should('contain', 'TEST - La Région Centrale')

// NavBreadcrumb
  // page.title

// ResponsiveImage

// CarouselImages

// CardMeta
  // :category="series[0]?.title"
  // :title="page?.title"
  // :guest-speaker="page.guestSpeaker"
  // :tag-labels="page.tagLabels"
  // :introduction="page.introduction"

// RichText - EventDescription
  // page.eventDescription

// RichText - Acknowledgements
  // page.acknowledements

// BlockEventDetail
  // :start-date="page.startDateWithTime"
  // :time="page.startDateWithTime"
  // :locations="page.location"

// BlockInfo
  // :ftva-ticket-information="page.ftvaTicketInformation"

// SectionScreeningDetails
  // arsedFTVAEventScreeningDetails

// SectionTeaserCard
  // parsedFtvaEventSeries

// UI Elements: Test visibility and functionality of important UI elements (e.g., buttons, links, modals)

// Verify that data is displayed correctly, especially dynamic data fetched from APIs

// Event Information Display: Ensure that all event details (title, description, date, time, location) are displayed correctly

// Add to Calendar: Verify that the "Add to Calendar" button works as expected

// Responsive Design: Check that the page renders correctly on different screen sizes

// Navigation: Ensure that navigation to and from the event detail page works smoothly


// named screen shot
    cy.percySnapshot('eventdetailpage', { widths: [768, 992, 1200] })
  })
})
