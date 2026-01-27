import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'
const isPercy = provider === 'percy'

function runHomepageTests({ withSnapshot = false, label = 'Desktop' } = {}) {
  it('Visit the Homepage', () => {
    cy.visit('/', { failOnStatusCode: false })
    if (label === 'Desktop') {
      cy.getByData('homepage-carousel').should('be.visible')
      cy.getByData('featured-event-items').should('be.visible')
      cy.getByData('quick-link-items').should('be.visible')
      cy.getByData('featured-article').should('be.visible')
      cy.getByData('featured-collection-items').should('be.visible')
      cy.getByData('preservation-image-slider').should('be.visible')

      cy.get('.footer-primary.ftva').should('be.visible')
      cy.get('.footer-links.ftva').should('be.visible')
      cy.get('.footer-sock.ftva').should('be.visible')
    }

    // UCLA brand
    // TODO Un comment this once header and footer are added back to default layout file.
    /* cy.get('.site-brand-bar').should('be.visible')
    cy.get('.visually-hidden').should('contain', 'UCLA Home')
    cy.get('.ucla-logo')
      .parent()
      .should('have.attr', 'href', 'https://www.ucla.edu')
    cy.get('.svg__logo-library')
      .parent()
      .should('have.attr', 'href', 'https://www.library.ucla.edu') */

    // cy.get('a.logo-ucla')
    //   .should('have.attr', 'href', 'https://www.library.ucla.edu')
    // NavPrimary

    if (withSnapshot) {
      cy.visualSnapshot('homePage')
    }
  })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Website Homepage - ${label}`, { viewportWidth, viewportHeight }, () => {
      runHomepageTests({ withSnapshot: true, label: `${label}` })
    })
  })
} else if (isPercy) {
  describe('Website Homepage', () => {
    runHomepageTests({ withSnapshot: true })
  })
} else {
  describe('Website Homepage', () => {
    runHomepageTests({ withSnapshot: false })
  })
}
