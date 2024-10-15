describe('Collection Detail Page', () => {
  it('Visits a Collection Detail Page', () => {
    cy.visit('/collections/test-get-used-to-it')
    cy.getByData('breadcrumb').should('be.visible')
    // sharebutton should be visible
    cy.getByData('share-button').should('be.visible')
    // cta should be in sidebar w specific data
    cy.getByData('sidebar-cta').should('be.visible')
    cy.percySnapshot('collectiondetailpage', { widths: [768, 992, 1200] })
  })
})
