describe('Touring Series Detail page', () => {
  it('Visit the Touring Series detail page', () => {
    cy.visit('/touring-series/through-indian-eyes-native-american-cinema')

    cy.percySnapshot('touringseriesdetailpage', { widths: [768, 992, 1200] })
  })
})
