describe('Website Homepage', () => {
  it('Visit the Homepage', () => {
    cy.visit('/')
    cy.viewport(1200, 1200)

    // UCLA brand
    cy.get('.site-brand-bar').should('be.visible')
    cy.get('.visually-hidden').should('contain', 'UCLA Home')
    cy.get('.ucla-logo')
      .parent()
      .should('have.attr', 'href', 'https://www.ucla.edu')
    cy.get('.svg__logo-library')
      .parent()
      .should('have.attr', 'href', 'https://www.library.ucla.edu')

    // cy.get('a.logo-ucla')
    //   .should('have.attr', 'href', 'https://www.library.ucla.edu')
    // NavPrimary

    cy.percySnapshot({ widths: [768, 992, 1200] })
  })
})
