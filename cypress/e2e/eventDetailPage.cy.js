describe('Event Detail page', () => {
  it('Visit a event Detail Page', () => {
    cy.visit('/events/la-région-centrale-03-08-24')

    cy.get('h3.title-no-link').should('contain', 'TEST - La Région Centrale')

    // NavBreadcrumb
    cy.get('span.current-page-title').should('contain', 'TEST - The Films of Michael Snow')

    // ResponsiveImage

    // CarouselImages
    cy.get('span.carousel').should('contain', 'Movie Database')

    // CardMeta
    cy.get('div.guestSpeaker').should('contain', 'Guest Speaker Graeme Ferguson')

    // :category="series[0]?.title"
    // :title="page?.title"
    // :guest-speaker="page.guestSpeaker"
    // :tag-labels="page.tagLabels"
    // :introduction="page.introduction"

    // RichText - EventDescription
    cy.get('div.eventDescription').should('contain', 'Event Description')
    // page.eventDescription

    // RichText - Acknowledgements
    cy.get('div.acknowledgements').should('contain', 'Acknowledgements/Funders')
    // page.acknowledements

    // BlockEventDetail
    cy.get('div.block-event-detail').should('contain', 'March 8, 2024')
    cy.get('div.block-event-detail').should('contain', '7:30 pm')
    cy.get('div.block-event-detail').should('contain', 'Billy Wilder Theater')
    // :start-date="page.startDateWithTime"
    // :time="page.startDateWithTime"
    // :locations="page.location"

    // BlockInfo
    cy.get('div.block-info').should('contain', 'Admission is free')
    // :ftva-ticket-information="page.ftvaTicketInformation"
    // button Plan Your Visit

    // SectionScreeningDetails
    cy.get('div.section-screening-details').should('contain', 'Trailer with Cover image - The Central Regions')
    // parsedFTVAEventScreeningDetails

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
