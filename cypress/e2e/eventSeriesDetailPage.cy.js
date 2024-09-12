describe('Event Series Detail page', () => {
  it('Visit the Homepage', () => {
    cy.visit('/series/step-up-series')

    cy.percySnapshot({ widths: [768, 992, 1200] })
  })
})
