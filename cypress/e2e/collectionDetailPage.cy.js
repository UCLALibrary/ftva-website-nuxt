describe('Collection Detail Page', () => {
  it('Visits a Basic Collection Detail Page', () => {
    cy.visit('/collections/test-get-used-to-it')
    cy.getByData('breadcrumb').should('be.visible')
    // page-collection-detail wrapper should exist on basic layouts
    cy.get('.page-collection-detail').should('exist')
    // sharebutton should exist
    cy.getByData('share-button').should('exist')
    // cta should be in sidebar w specific data
    cy.getByData('sidebar-cta').should('exist')
    cy.percySnapshot('collectiondetailpage', { widths: [768, 992, 1200] })
  })

  it('Visits a List of Items Collection Detail Page', () => {
    cy.visit('/collections/ktla-newsfilm-collection')
    cy.getByData('breadcrumb').should('be.visible')
    // page-collections-list-of-items wrapper should exist on list of items layouts
    cy.get('.page-collections-list-of-items').should('exist')
    cy.percySnapshot('complexcollectionpage', { widths: [768, 992, 1200] })
  })
})
