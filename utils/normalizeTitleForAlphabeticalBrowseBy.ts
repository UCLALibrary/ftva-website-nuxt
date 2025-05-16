/**
 * Normalizes a title string for consistent sorting and prefix filtering.
 * - Removes leading stop words (The, A, An)
 * - Strips curly and straight quotes from the start/end
 * - Trims whitespace
 *
 * Useful for generating fields like `titleBrowse` in search indexes.
 */
function normalizeTitleForAlphabeticalBrowse(title: string): string {
  return title
    // Normalize curly quotes to straight quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

    // Remove all leading/trailing straight or curly quotes
    .replace(/^["']+|["']+$/g, '')

    // Remove leading stop words like "The", "A", or "An"
    .replace(/^(the|a|an)\s+/i, '')

    // Trim extra whitespace
    .trim()
}

export default normalizeTitleForAlphabeticalBrowse
