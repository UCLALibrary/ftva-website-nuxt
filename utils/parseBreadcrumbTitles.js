// In the NavBreadcrumb component, breadcrumb titles can be extracted from the route; but special characters/punctuations are not preserved in url patterns and will not be reflected in the title.

// This helper rewrites titles for nested breadcrumbs that need to preserve special characters/punctuations in their titles.

// For example: Breadcrumb title 'La Rebellion' -- extracted from a url (/collections/la-rebellion/bush-mama/) -- can be overridden to 'L.A. Rebellion'; breadcrumb title 'Ktla Newsfilm Collection' can be overridden to 'KTLA Newsfilm Collection', and so on.

// In the switch statment, add a unique field (sectionHandle, collectionSlug, etc.) associated with a template/page that needs an override, and return the new title to be used at the template/page level.

function parseFieldForBreadcrumbTitleOverride(str) {
  switch (str) {
    case 'ftvaListingLaRebellionFilmmakers': // Filmmaker Listing
      return 'LARebellion1'
    case 'ftvaCollectionListingLARebellion': // Filmography Listing
      return 'LARebellion2'
    case 'ftvaLARebellionIndividual': // Filmmaker Detail
      // return 'L.A. Rebellion'
      return 'LARebellion3'

    default:
      return null
  }
}

export default parseFieldForBreadcrumbTitleOverride
