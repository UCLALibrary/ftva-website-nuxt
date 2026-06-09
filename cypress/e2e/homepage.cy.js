import { viewports } from '../support/viewports'

const provider = Cypress.env('VISUAL_PROVIDER')
const isChromatic = provider === 'chromatic'

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

  // TODO: below test is failing, reenable when LADI-5226, LADI-5231 is fixed
  // Use Axe-core to check for critical and serious accessibility violations
  // To prevent cypress from hanging, we set the retries to 0 and put this test at the end of the tests
  // it('has no accessibility violations', {
  //   retries: {
  //     runMode: 0,
  //     openMode: 0,
  //   },
  // }, () => {
  //   cy.visit('/series/step-up-series', { failOnStatusCode: false })
  //   cy.injectAxe()
  //   // add 'moderate' to the includedImpacts array to check for moderate accessibility violations
  //   // check the entire page for accessibility violations, including the header and footer
  //   cy.checkA11y(null, { includedImpacts: ['critical', 'serious'] }, (violations) => {
  //     violations.forEach((violation) => {
  //       cy.log(`Accessibility Violation: ${violation.id} ${violation.impact}
  //       Description: ${violation.description}
  //       Help: ${violation.help} ${violation.helpUrl}
  //       HTML hint: ${violation.nodes.length} ${violation.nodes[0].html}`)
  //     })
  //   })
  // })
}

if (isChromatic) {
  viewports.forEach(({ label, viewportWidth, viewportHeight }) => {
    describe(`Website Homepage - ${label}`, { viewportWidth, viewportHeight }, () => {
      runHomepageTests({ withSnapshot: true, label: `${label}` })
    })
  })
} else {
  describe('Website Homepage', () => {
    runHomepageTests({ withSnapshot: false })
  })
}
