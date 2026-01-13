const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 },
]

export function visualSnapshot(name) {
  const provider = Cypress.env('VISUAL_PROVIDER')

  if (provider === 'chromatic') {
    viewports.forEach(({ name: vpName, width, height }) => {
      cy.viewport(width, height)
      cy.takeSnapshot(`${name} - ${vpName}`)
    })
    return
  }

  // Default (Percy)
  cy.percySnapshot(name)
}
