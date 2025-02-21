describe('Collection Item Detail Page', () => {
  it('Visits a Collection Item Detail Page', () => {
    cy.visit('/collections/la-rebellion/grey-area')
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('page-title').should('be.visible')
    cy.getByData('related-content').should('be.visible')
    cy.percySnapshot('collectionitemdetailpage', { widths: [768, 992, 1200] })
  })
})
