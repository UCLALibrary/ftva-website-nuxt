/**
 * Normalizes a title string for consistent sorting and prefix filtering.
 * - Removes leading stop words (The, A, An)
 * - Strips curly and straight quotes globally
 * - Trims whitespace
 *
 * Useful for generating fields like `titleBrowse` in search indexes.
 */
function normalizeTitleForAlphabeticalBrowse(title: string): string {
  return title
    // Normalize curly quotes to straight quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

    // Remove all quotes (straight or curly, anywhere in the string)
    .replace(/["']/g, '')

    // Remove leading stop words like "The", "A", or "An"
    .replace(/^(the|a|an)\s+/i, '')

    // Trim extra whitespace
    .trim()
}

export default normalizeTitleForAlphabeticalBrowse
