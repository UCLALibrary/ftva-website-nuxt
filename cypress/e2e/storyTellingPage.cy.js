Cypress.on('uncaught:exception', () => { return false })

describe('Complex Collection StoryTelling Page', () => {
  it('Visits the L.A. Rebellion StoryTelling Page', () => {
    cy.visit('/collections/la-rebellion')
    cy.getByData('hero-image').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('flexible-blocks-content').should('be.visible')
    cy.percySnapshot('collectiondetailpage', { widths: [768, 992, 1200] })
  })
})
