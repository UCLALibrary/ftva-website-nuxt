/***
 * This composable handles toggling between desktop pagination and mobile infinite scroll.
 * @param {Number} documentsPerPage number of results to show per page
 * @param {Function} fetchFn function to call to fetch elasticsearch results
 * @returns the following:
 * - isLoading: boolean indicating if the page is loading
 * - isMobile: boolean indicating if the current view is mobile
 * - hasMore: boolean indicating if there are more pages to load
 * - currentList: the current list of items to display, depending on desktop or mobile view
 * - mobileItemList: the list of items to display in mobile view
 * - desktopPage: the current page number for desktop view
 * - desktopItemList: the list of items to display in desktop view
 * - currentPage: the current page number for the current view
 * - totalPages: the total number of pages available
 * - scrollElem: the element to attach the infinite scroll to
 * - reset: function to reset the infinite scroll
 * - searchES: function to call when reloading the search results on the page
 */

import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

export default function useMobileInfiniteScroll<T = any>(
  fetchFn: (page: number) => Promise<T>,
  onResults: (results: T) => void
) {
  // DESKTOP STATE
  const desktopPage = useState('desktopPage', () => 1) // Persist desktop page #
  const desktopItemList = ref([]) // Persist desktop item list

  // MOBILE STATE
  const mobileItemList = ref([]) // Persist mobile item list

  // CURRENT STATE
  const isLoading = ref(false)
  const isMobile = ref(false)
  const hasMore = ref(true)
  const currentList = computed(() => (isMobile.value ? mobileItemList.value : desktopItemList.value))
  const currentPage = ref(1)
  const totalPages = ref(0)
  const scrollElem = ref<HTMLElement | null>(null)
  const route = useRoute()

  // ES SEARCH FUNCTION
  async function searchES() {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true

    try {
      // use callbback fetchFn to get search results
      console.log(`Fetching data for page ${currentPage.value}...`)
      const results = await fetchFn(currentPage.value)
      onResults(results)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', err)
      hasMore.value = false
    } finally {
      isLoading.value = false
    }
  }

  const { reset } = useInfiniteScroll(
    scrollElem,
    async () => {
      if (isMobile.value && hasMore.value && !isLoading.value) {
        if (mobileItemList.value.length === 0) {
          currentPage.value = 1
          // Initial load

          // console.log('Initial load for mobile infinite scroll...')
        } else {
          currentPage.value++
        }

        // eslint-disable-next-line no-console
        console.log(`Loading more items for page ${currentPage.value}...`)
        await searchES()
      }
    },
    { distance: 100 }
  )

  // HANDLE WINDOW SIZING
  const { width } = useWindowSize()
  watch(width, (newWidth) => {
    // console.log('Window width changed:', newWidth)
    const wasMobile = isMobile.value

    isMobile.value = newWidth <= 750
    // Reinitialize only when transitioning between mobile and desktop
    if (wasMobile !== isMobile.value) {
      handleScreenTransition()
    }
  }, { immediate: true })

  // HANDLE SCREEN TRANSITIONS - pass this whole function as arg?
  function handleScreenTransition() {
    if (isMobile.value) {
      // Switching to mobile: save desktop page, clear query param
      desktopPage.value = currentPage.value
      currentPage.value = 1
      mobileItemList.value = []
      hasMore.value = true
      const { page, ...remainingQuery } = route.query
      useRouter().push({ query: { ...remainingQuery } })
    } else {
      // Switching to desktop: restore query param
      if (totalPages.value === 1)
        desktopPage.value = 1
      const restoredPage = desktopPage.value || 1
      useRouter().push({ query: { ...route.query, page: restoredPage.toString() } })
      currentPage.value = restoredPage
      desktopItemList.value = []
    }

    // eslint-disable-next-line no-console
    console.log(`Switched to ${isMobile.value ? 'mobile' : 'desktop'} view`)
  }

  return {
    isLoading,
    isMobile,
    hasMore,
    mobileItemList,
    desktopPage,
    desktopItemList,
    currentPage,
    currentList,
    scrollElem,
    totalPages,
    reset,
    searchES,
  }
}
