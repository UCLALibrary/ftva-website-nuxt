describe('Filmmakers Detail Page', () => {
  it('Shows a specific filmmakers profile based on slug', () => {
    cy.visit('/collections/la-rebellion/filmmakers/bernard-nicolas')

    cy.percySnapshot('larebellionfilmmakersdetail', { widths: [768, 992, 1200] })
  })
})
