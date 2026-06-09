import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runArchiveResearchTests({ withSnapshot = false } = {}) {
  it('Visits the Archive Research Study Center Page', () => {
    cy.visit('/archive-research-study-center')
    cy.get('#main').should('have.class', 'archive-research-study-center')

    if (withSnapshot) {
      cy.visualSnapshot('arscpage')
    }
  })

  it('Visits the Instructional Media Collections & Services Page', () => {
    cy.visit('/instructional-media-collections-services')
    cy.get('#main').should('have.class', 'instructional-media-collections-services')

    if (withSnapshot) {
      cy.visualSnapshot('imcspage')
    }
  })
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/archive-research-study-center')
    cy.injectAxe()
    // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
    cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
      violations.forEach((violation) => {
        cy.log(`Accessibility Violation: ${violation.id} ${violation.impact} 
        Description: ${violation.description} 
        Help: ${violation.help} ${violation.helpUrl} 
        HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
      })
    })
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Archive Research Study Center - ${label}`, { viewportWidth, viewportHeight }, () => {
      runArchiveResearchTests({ withSnapshot: true })
    })
  })
} else {
  describe('Archive Research Study Center', () => {
    runArchiveResearchTests({ withSnapshot: false })
  })
}
