describe('Event Series List page', () => {
  it('Visits the Event List page', () => {
    cy.visit('/series')

    cy.percySnapshot('eventserieslistpage')
  })
})
