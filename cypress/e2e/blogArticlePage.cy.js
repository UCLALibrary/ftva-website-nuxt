import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runBlogArticleTests({ withSnapshot = false } = {}) {
  it('Visits a Blog Article Page', () => {
    cy.visit('/blog/test-tom-reeds-for-members-only-black-perspectives-on-local-l-a-tv', { failOnStatusCode: false })
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('recent-posts').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('blogarticlepage')
  })

  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  it('has no accessibility violations', {
    retries: {
      runMode: 0,
      openMode: 0,
    },
  }, () => {
    cy.visit('/blog/test-tom-reeds-for-members-only-black-perspectives-on-local-l-a-tv', { failOnStatusCode: false })
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
    describe(`Blog Article Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runBlogArticleTests({ withSnapshot: true })
    })
  })
} else {
  describe('Blog Article Page', () => {
    runBlogArticleTests({ withSnapshot: false })
  })
}
