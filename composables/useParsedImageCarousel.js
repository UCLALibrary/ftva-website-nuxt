/**
 * Parses imageCarousel data with responsive sizes for hero/carousel display.
 * Use this when you need to display image carousels across slug pages, collections, etc.
 *
 * @param {Ref<{ imageCarousel?: Array }>} page - Ref to page/entry data containing imageCarousel
 * @param {Object} options
 * @param {string} [options.sizes] - Responsive sizes string for images. Defaults to one-column hero layout.
 * @returns {ComputedRef<Array>} Parsed image carousel items with sizes applied
 *
 * @example
 * const page = ref(data.value.ftvaCollection)
 * const parsedImage = useParsedImageCarousel(page)
 *
 * // With custom sizes for a different layout:
 * const parsedImage = useParsedImageCarousel(page, {
 *   sizes: '(min-width: 1380px) 365px, calc(24.23vw + 35px)'
 * })
 */
export function useParsedImageCarousel(page, options = {}) {
  const defaultSizes = '(min-width: 1220px) 1160px, (min-width: 760px) calc(90.91vw - 59px), calc(100vw - 48px)'
  const sizes = options.sizes ?? defaultSizes

  return computed(() => {
    const imageCarousel = page.value?.imageCarousel
    if (!imageCarousel || !Array.isArray(imageCarousel) || imageCarousel.length === 0) {
      return []
    }
    return imageCarousel.map(item => ({
      ...item,
      image: [{ ...item.image[0], sizes }]
    }))
  })
}
