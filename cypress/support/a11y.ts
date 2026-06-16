const A11Y_TEST_RETRIES = {
  runMode: 0,
  openMode: 0,
} as const

export type A11yTestOptions = {
  selector?: string | null
  impacts?: string[]
  visitOptions?: Partial<Cypress.VisitOptions>
  skip?: boolean
}

function runA11yTest(
  url: string,
  { selector = '#main', impacts, visitOptions = {} }: A11yTestOptions = {}
) {
  cy.visit(url, { failOnStatusCode: false, ...visitOptions })
  cy.checkCriticalA11y(selector, impacts)
}

function registerA11yTest(
  url: string,
  options: A11yTestOptions = {},
  register: typeof it | typeof it.skip
) {
  register(
    'has no accessibility violations',
    { retries: A11Y_TEST_RETRIES },
    () => runA11yTest(url, options)
  )
}

export function a11yIt(url: string, options: A11yTestOptions = {}) {
  if (options.skip) {
    a11yIt.skip(url, options)
    return
  }
  registerA11yTest(url, options, it)
}

a11yIt.skip = (url: string, options: Omit<A11yTestOptions, 'skip'> = {}) => {
  registerA11yTest(url, options, it.skip)
}
