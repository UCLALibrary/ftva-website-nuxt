import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

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
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Archive Research Study Center - ${label}`, { viewportWidth, viewportHeight }, () => {
      runArchiveResearchTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Archive Research Study Center', () => {
    runArchiveResearchTests({ withSnapshot: true })
  })
} else {
  describe('Archive Research Study Center', () => {
    runArchiveResearchTests({ withSnapshot: false })
  })
}
