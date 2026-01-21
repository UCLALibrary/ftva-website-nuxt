Cypress.on('uncaught:exception', () => false)

import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runBlogListingTests({ withSnapshot = false }) {
  it('Visits Blog Listing page', () => {
    cy.visit('/blog')
    cy.getByData('blog-page-title').should('be.visible')
    cy.getByData('featured-blog-0').should('be.visible')
    cy.getByData('featured-blog-1').should('be.visible')
    cy.getByData('featured-blog-2').should('be.visible')
    cy.getByData('latest-blogs').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('bloglistpage')
    }
  })
}

function runMobileBehaviorTest() {
  it('Shows only one featured blog in mobile view', () => {
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
      runBlogListingTests({ withSnapshot: true })
    })
  })
}

// ---- Percy: single run + snapshot ----
else if (isPercy) {
  describe('Blog Listing Page', () => {
    runBlogListingTests({ withSnapshot: true })
  })
}

// ---- Local or CI: no snapshots, but keep behavior tests ----
else {
  describe('Blog Listing Page', () => {
    runBlogListingTests({ withSnapshot: false })
    runMobileBehaviorTest()
  })
}
