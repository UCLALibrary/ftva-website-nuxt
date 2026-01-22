import { viewports } from '../support/viewports'

Cypress.on('uncaught:exception', () => { return false })

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runStoryTellingTests({ withSnapshot = false } = {}) {
  it('Visits the L.A. Rebellion StoryTelling Page', () => {
    cy.visit('/collections/la-rebellion')

    cy.getByData('main-image').should('be.visible')
    cy.getByData('page-heading').should('be.visible')
    cy.getByData('flexible-blocks-content').should('be.visible')

    if (withSnapshot) {
      cy.visualSnapshot('storyTellingPage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Complex Collection StoryTelling Page – ${label}`, { viewportWidth, viewportHeight }, () => {
      runStoryTellingTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Complex Collection StoryTelling Page', () => {
    runStoryTellingTests({ withSnapshot: true })
  })
} else {
  describe('Complex Collection StoryTelling Page', () => {
    runStoryTellingTests({ withSnapshot: false })
  })
}
