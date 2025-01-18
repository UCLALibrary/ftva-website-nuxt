describe('Filmmakers Detail Page', () => {
  it('Shows a specific filmmakers profile based on slug', () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person')

    cy.percySnapshot('larebellionfilmmakersdetail', { widths: [768, 992, 1200] })
  })
})
