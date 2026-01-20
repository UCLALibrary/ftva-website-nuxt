describe('Billy Wilder Theater Page', () => {
  it('Visits the Billy Wilder Theater Page', () => {
    cy.visit('/billy-wilder-theater')
    cy.getByData('hero-image').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('page-description').should('be.visible')
    cy.getByData('admissions-intro').should('be.visible')
    cy.getByData('admissions-info').should('be.visible')
    cy.getByData('theater-address').should('be.visible')
    cy.getByData('theater-map').should('be.visible')
    cy.getByData('parking-info').should('be.visible')
    cy.visualSnapshot('billyWilderTheaterpage')
  })
})
