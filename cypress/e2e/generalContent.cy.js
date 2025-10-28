describe('General Content page', () => {
  it('Visit a General Content Page', () => {
    cy.visit('/about')

    cy.percySnapshot('generalContentPage')
  })
})
