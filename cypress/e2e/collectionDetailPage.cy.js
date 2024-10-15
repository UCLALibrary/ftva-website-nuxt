describe('Collection Detail Page', () => {
  it('Visits a Collection Detail Page', () => {
    cy.visit('/collections/test-collection-two')
    cy.getByData('breadcrumb').should('be.visible')
    // sharebutton should be visible
    // cta should be in sidebar w specific data
    cy.percySnapshot('collectiondetailpage', { widths: [768, 992, 1200] })
  })
})
