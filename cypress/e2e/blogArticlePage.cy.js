import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runBlogArticleTests({ withSnapshot = false } = {}) {
  it('Visits a Blog Article Page', () => {
    cy.visit('/blog/test-tom-reeds-for-members-only-black-perspectives-on-local-l-a-tv', { failOnStatusCode: false })
    cy.getByData('breadcrumb').should('be.visible')
    cy.getByData('recent-posts').should('be.visible')

    if (withSnapshot) cy.visualSnapshot('blogarticlepage')
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Blog Article Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runBlogArticleTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Blog Article Page', () => {
    runBlogArticleTests({ withSnapshot: true })
  })
} else {
  describe('Blog Article Page', () => {
    runBlogArticleTests({ withSnapshot: false })
  })
}
