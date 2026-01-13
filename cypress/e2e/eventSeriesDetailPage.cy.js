describe('Event Series Detail page', () => {
  it('Visit the Homepage', () => {
    cy.visit('/series/step-up-series')

    cy.visualSnapshot('eventseriesdetailpage')
  })
})
