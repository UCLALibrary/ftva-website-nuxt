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

export default function useMobileInfiniteScroll(documentsPerPage = 10, fetchFn = () => Promise.resolve({})) {
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
  const scrollElem = ref(null)
  const route = useRoute()

  // ES SEARCH FUNCTION
  async function searchES() {
    if (isLoading.value || !hasMore.value) return

    isLoading.value = true

    try {
      // use callbback fetchFn to get search results
      const results = await fetchFn()

      if (results && results.hits && results?.hits?.hits?.length > 0) {
        console.log('results', results)

        const newArticles = results.hits.hits || []

        if (isMobile.value) {
          totalPages.value = 0
          mobileItemList.value.push(...newArticles)
          hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
        } else {
          console.log('desktop results total pages', Math.ceil(results.hits.total.value / documentsPerPage))
          desktopItemList.value = newArticles
          totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
        }
      } else {
        totalPages.value = 0
        hasMore.value = false
      }
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
        currentPage.value++
        await searchES()
      }
    },
    { distance: 100 }
  )

  // HANDLE WINDOW SIZING
  const { width } = useWindowSize()
  watch(width, (newWidth) => {
    console.log('Window width changed:', newWidth)
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
      const restoredPage = dinesktopPage.value || 1
      useRouter().push({ query: { ...route.query, page: restoredPage.toString() } })
      currentPage.value = restoredPage
      desktopItemList.value = []
    }
    searchES()
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
