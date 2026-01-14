describe('Touring Series Detail page', () => {
  it('Visit the Touring Series detail page', () => {
    cy.visit('/touring-series/through-indian-eyes-native-american-cinema')

    cy.visualSnapshot('touringseriesdetailpage')
  })
})
