describe('Archive Research Study Center', () => {
  it('Visits the Archive Research Study Center Page', () => {
    cy.visit('/archive-research-study-center')
    cy.get('#main').should('have.class', 'archive-research-study-center')
    cy.percySnapshot('arscpage')
  })
  it('Visits the Instructional Media Collections & Services Page', () => {
    cy.visit('/instructional-media-collections-services')
    cy.get('#main').should('have.class', 'instructional-media-collections-services')
    cy.percySnapshot('imcspage')
  })
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the file
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/archive-research-study-center')
    cy.injectAxe()
    cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id}`)
      })
    })
  })
})
