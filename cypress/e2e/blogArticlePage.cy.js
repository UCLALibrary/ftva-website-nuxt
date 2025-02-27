describe('Blog Article Page', () => {
  it('Visits a Blog Article Page', () => {
    cy.visit('/blog/test-tom-reeds-for-members-only-black-perspectives-on-local-l-a-tv', { failOnStatusCode: false })
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('recent-posts').should('be.visible')
    cy.percySnapshot('blogarticlepage', { widths: [768, 992, 1200] })
  })
})
