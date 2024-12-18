describe('Event List page', () => {
  it('Visits the Event List page', () => {
    cy.visit('/events')

    cy.percySnapshot('eventlistpage', { widths: [768, 992, 1200] })
  })
})