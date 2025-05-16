/***
 * This composable handles toggling between desktop pagination and mobile infinite scroll.
 * @param {Function} searchEsFn function to call when the page changes, generally an elasticsearch function
 * @return {Object} an object containing the following properties:
 * - isLoading: boolean indicating if the page is loading
 * - isMobile: boolean indicating if the current view is mobile
 * - hasMore: boolean indicating if there are more pages to load
 * - currentList: the current list of items to display, depending on desktop or mobile view
 * - scrollElem: the element to attach the infinite scroll to
 * - reset: function to reset the infinite scroll
 */
import { useWindowSize, useInfiniteScroll } from '@vueuse/core'

export default function useMobileInfiniteScroll(searchEsFn) {
  const localState = reactive({
    isLoading: false,
    isMobile: false,
    hasMore: true,
    currentPage: 1,
    desktopPage: 1,
    desktopItemList: [],
    mobileItemList: [],
  })
  // DESKTOP STATE
  // const desktopPage = useState('desktopPage', () => 1) // Persist desktop page #
  // const desktopItemList = ref([]) // Persist desktop item list

  // MOBILE STATE
  // const mobileItemList = ref([]) // Persist mobile item list

  // CURRENT STATE
  // const isLoading = ref(false)
  // const isMobile = ref(false)
  // const hasMore = ref(true)
  const currentList = computed(() => (isMobile.value ? mobileItemList.value : desktopItemList.value))
  // const currentPage = ref(1)
  const scrollElem = ref(null)
  
  // a function to update the values of the state
  function updateValues(newValues) {
    console.log('Updating values:', newValues)
    Object.keys(newValues).forEach((key) => {
      console.log('checking key:', key)
      if (localState[key] !== undefined) {
        console.log(`Updating ${key} to ${newValues[key]}`);
        localState[key] = newValues[key];
        console.log(localState[key]);
      }
    });
  };

  const { reset } = useInfiniteScroll(
    scrollElem,
    async () => {
      if (isMobile.value && hasMore.value && !isLoading.value) {
        currentPage.value++
        await searchEsFn()
      }
    },
    { distance: 100 }
  )

  // HANDLE WINDOW SIZING
  const { width } = useWindowSize()
  watch(width, (newWidth) => {
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
    console.log('about to call searchES from inside mobileInfiniteScroll')
    searchEsFn()
  }

  return {
    isLoading,
    isMobile,
    hasMore,
    mobileItemList,
    desktopItemList,
    currentPage,
    currentList,
    scrollElem,
    updateValues,
    reset
  }
}