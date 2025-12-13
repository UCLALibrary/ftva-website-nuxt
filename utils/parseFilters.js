function parseFilters(filtersString) {
  if (!filtersString) return {}

  console.log('ParseFilters filters string: ', filtersString)

  const filters = {}
  const conditions = filtersString.split(' AND ')
  console.log('ParseFilters Conditions: ', conditions)

  conditions.forEach((condition) => {
    // test
    condition = condition.replaceAll(',', '')
    const [key, value] = condition.split(':(')
    const cleanedKey = key.trim()
    const values = value.replace(')', '').split(',').map(v => v.trim())

    filters[cleanedKey] = values
  })

  console.log('ParseFilters filters: ', filters)
  return filters
}

export default parseFilters
