describe('Archive Research Study Center', () => {
  it('Visits the Archive Research Study Center Page', () => {
    cy.visit('/archive-research-study-center')
    cy.get('#main').should('have.class', 'archive-research-study-center')
    cy.percySnapshot('arscpage', { widths: [768, 992, 1200] })
  })
  it('Visits the Instructional Media Collections & Services Page', () => {
    cy.visit('/instructional-media-collections-services')
    cy.get('#main').should('have.class', 'instructional-media-collections-services')
    cy.percySnapshot('imcspage', { widths: [768, 992, 1200] })
  })
})
