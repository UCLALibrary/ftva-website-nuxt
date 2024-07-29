describe('Event Detail page', () => {
  it('Visit a event Detail Page', () => {
    cy.visit('/events/la-région-centrale-03-08-24')

    cy.get('h3.title-no-link').should('contain', 'TEST - La Région Centrale')

    cy.percySnapshot({ widths: [768, 992, 1200] })
  })
})
