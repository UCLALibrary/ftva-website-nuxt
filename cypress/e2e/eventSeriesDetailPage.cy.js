describe('Event Series Detail page', () => {
  it('Visit the Homepage', () => {
    cy.visit('/series/step-up-series')

    cy.percySnapshot('eventseriesdetailpage', { widths: [768, 992, 1200] })
  })
})
