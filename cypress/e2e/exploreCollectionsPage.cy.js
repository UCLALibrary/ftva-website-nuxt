Cypress.on('uncaught:exception', () => { return false })

describe('Explore Collections page', () => {
  it('Visits the Explore Collections page', () => {
    cy.visit('/collections')

    cy.getByData('single-image').should('be.visible')

    cy.getByData('page-heading').should('be.visible')

    cy.getByData('page-description').should('be.visible')

    cy.getByData('featured-collection').should('be.visible')

    cy.getByData('hearst-collection').should('be.visible')

    cy.getByData('other-resources').should('be.visible')

    cy.getByData('about-collections').should('be.visible')

    cy.percySnapshot('exploreCollectionsPage', { widths: [768, 992, 1200] })
  })
})
