describe('Collection Detail Page', () => {
  it('Visits a Collection Detail Page', () => {
    cy.visit('/collections/test-get-used-to-it')
    cy.getByData('breadcrumb').should('be.visible')
    // sharebutton should exist
    cy.getByData('share-button').should('exist')
    // cta should be in sidebar w specific data
    cy.getByData('sidebar-cta').should('exist')
    cy.percySnapshot('collectiondetailpage', { widths: [768, 992, 1200] })
  })
})
