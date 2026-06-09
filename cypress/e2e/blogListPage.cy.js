import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => false)

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

function runBlogListingTests({ withSnapshot = false, label = 'Desktop' } = {}) {
  it('Visits Blog Listing page', () => {
    cy.visit('/blog')
    if (label === 'Desktop') {
      cy.getByData('blog-page-title').should('be.visible')
      cy.getByData('featured-blog-0').should('be.visible')
      cy.getByData('featured-blog-1').should('be.visible')
      cy.getByData('featured-blog-2').should('be.visible')
      cy.getByData('latest-blogs').should('be.visible')
    }

    if (withSnapshot) {
      cy.visualSnapshot('bloglistpage')
    }
  })

  // TODO: below test is failing, reenable when LADI-5227 is fixed
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  // it('has no accessibility violations', {
  //   retries: {
  //     runMode: 0,
  //     openMode: 0,
  //   },
  // }, () => {
  //   cy.visit('/blog', { failOnStatusCode: false })
  //   cy.injectAxe()
  //   // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
  //   cy.checkA11y('#main', { includedImpacts: ['critical', 'serious'] }, (violations) => {
  //     violations.forEach((violation) => {
  //       cy.log(`Accessibility Violation: ${violation.id} ${violation.impact}
  //       Description: ${violation.description}
  //       Help: ${violation.help} ${violation.helpUrl}
  //       HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
  //     })
  //   })
  // })
}

function runMobileBehaviorTest() {
  it('Shows only one featured blog in mobile view', () => {
    cy.visit('/blog')
    cy.viewport(750, 720)

    cy.getByData('featured-blog-0').should('be.visible')
    cy.getByData('featured-blog-1').should('not.be.visible')
    cy.getByData('featured-blog-2').should('not.be.visible')
  })
}

// ---- Chromatic: loop viewports using describe config (NO cy.viewport) ----
if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Blog Listing Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runBlogListingTests({ withSnapshot: true, label: `${label}` })
    })
  })
}
// ---- Local or CI: no snapshots, but keep behavior tests ----
else {
  describe('Blog Listing Page', () => {
    runBlogListingTests({ withSnapshot: false })
    runMobileBehaviorTest()
  })
}
