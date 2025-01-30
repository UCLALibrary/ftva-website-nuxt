describe('Filmmakers Detail Page', () => {
  it('Visits the LA Rebellion Filmmaker Detail page', () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person')

    cy.percySnapshot('larebellionfilmmakersdetail', { widths: [768, 992, 1200] })
  })
})
