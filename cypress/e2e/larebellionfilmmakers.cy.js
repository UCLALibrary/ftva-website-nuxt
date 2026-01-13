describe('Filmmakers Detail Page', () => {
  it('Visits the LA Rebellion Filmmaker Detail page', () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person')

    visualSnapshot('larebellionfilmmakersdetail')
  })
})
