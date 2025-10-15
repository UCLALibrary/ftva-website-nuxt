Cypress.on('uncaught:exception', () => { return false })

describe('Blog Listing page', () => {
  beforeEach(() => {
    cy.visit('/blog')
  })

  it('Visits Blog Listing page', () => {
    cy.getByData('blog-page-title').should('be.visible')

    cy.getByData('featured-blog-0').should('be.visible')

    cy.getByData('featured-blog-1').should('be.visible')

    cy.getByData('featured-blog-2').should('be.visible')

    cy.getByData('latest-blogs').should('be.visible')

    cy.percySnapshot('bloglistpage', { widths: [768, 992, 1200] })
  })

  it('Shows only one featured blog in mobile view', () => {
    cy.viewport(750, 720)

    cy.getByData('featured-blog-0').should('be.visible')

    cy.getByData('featured-blog-1').should('not.be.visible')

    cy.getByData('featured-blog-2').should('not.be.visible')
  })
})
