import { useWindowScroll } from '@vueuse/core'

export type PaginationScrollOptions = {
  /** Run your resets + await searchES() here */
  onPageChange: () => Promise<void>
  /** Skip scrolling on mobile */
  isMobile: Ref<boolean>
  /** Only scroll when this returns true (e.g., list has items) */
  hasResults: Ref<boolean>
  /** Offset for sticky header etc. Default 300 */
  offset?: number
  /** Scroll behavior. Default 'smooth' */
  behavior?: ScrollBehavior
}

/**
 * usePaginationScroll
 * - Watches route.query.page
 * - Runs onPageChange() that YOU provide (do resets + searchES() there)
 * - Scrolls window to anchor after DOM updates
 *
 * @param {Ref<HTMLElement|null>} anchorRef
 * @param {Object} opts
 * @param {() => Promise<void>|void} opts.onPageChange - Your function to run on page change (e.g., await searchES()).
 * @param {import('vue').Ref<boolean>|boolean} opts.isMobile - Skip scroll on mobile.
 * @param {() => boolean} opts.hasResults - Return true if list has items.
 * @param {number} opts.offset - Scroll offset for sticky headers (default 300).
 */
export default function usePaginationScroll(anchorRef: Ref<HTMLElement | null>,
  opts: PaginationScrollOptions) {
  const route = useRoute()
  const {
    onPageChange,
    isMobile,
    hasResults,
    offset = 300,
    behavior = 'smooth',
  } = opts
  const { y } = useWindowScroll({ behavior })

  async function scrollToAnchor() {
    await nextTick()
    if (!import.meta.client) return
    const el = anchorRef?.value
    console.log('scrollToAnchor called', el, y.value)

    if (!el) return
    console.log('scrollToAnchor found element', el)
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    y.value = top
  }
  // This watcher is called when router pushes updates the query params
  watch(
    () => route.query,
    async () => {
      // Let the page do its thing (clear lists, parse filters, await searchES, etc.)
      await onPageChange()
      // Only scroll on desktop and when we actually have results
      if (!isMobile.value && route.query.page && hasResults) {
        await scrollToAnchor()
      }
    },
    { deep: true, immediate: true }
  )

  // expose manual trigger if needed
  return { scrollTo: scrollToAnchor }
}
