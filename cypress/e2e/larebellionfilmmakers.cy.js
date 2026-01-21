import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runFilmmakerDetailTests({ withSnapshot = false } = {}) {
  it('Visits the LA Rebellion Filmmaker Detail page', () => {
    cy.visit('/collections/la-rebellion/filmmakers/test-person')

    if (withSnapshot) {
      cy.visualSnapshot('larebellionfilmmakersdetail')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Filmmakers Detail Page - ${label}`, { viewportWidth, viewportHeight }, () => {
      runFilmmakerDetailTests({ withSnapshot: true })
    })
  })
} else if (isPercy) {
  describe('Filmmakers Detail Page', () => {
    runFilmmakerDetailTests({ withSnapshot: true })
  })
} else {
  describe('Filmmakers Detail Page', () => {
    runFilmmakerDetailTests({ withSnapshot: false })
  })
}
