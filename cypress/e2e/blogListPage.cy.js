Cypress.on('uncaught:exception', () => { return false })

describe('Blog Listing page', () => {
  beforeEach(() => {
    cy.visit('/blog')
  })

  it('Visits Blog Listing page', () => {
    cy.getByData('blog-page-title').should('be.visible')

    // Featured blog should be visible?

    // At least one latest blogs?

    cy.percySnapshot('eventslistpage', { widths: [768, 992, 1200] })
  })
})
