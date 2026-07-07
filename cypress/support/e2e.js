// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import 'cypress-axe'
// cypress/support/e2e.js
import '@chromatic-com/cypress/support'

// Import commands.js using ES2015 syntax:
import './commands.js'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Overwrite the log command to log to the console and the task queue
Cypress.Commands.overwrite('log', (subject, message) => {
  cy.task('log', message)
})
