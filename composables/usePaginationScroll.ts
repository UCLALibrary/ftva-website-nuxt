/**
 * Composable for handling scroll position restoration during pagination
 * @param {string} elementId - The ID of the element to scroll to after pagination
 * @returns {Object} - Object containing savedScrollPosition ref and restoreScrollPosition function
 */
export default function usePaginationScroll(elementId: string) {
  // Track scroll position for pagination
  const savedScrollPosition = ref<number>(0)

  // Save scroll position before route update
  onBeforeRouteUpdate((to, from) => {
    console.log('onBeforeRouteUpdate', to, from)
    if (to.query.page !== from.query.page) {
      console.log('Saving scroll position:', window.scrollY)
      savedScrollPosition.value = window.scrollY
    }
  })

  // Function to restore scroll position
  const restoreScrollPosition = (): void => {
    if (savedScrollPosition.value > 0) {
      console.log('Restoring scroll position:', savedScrollPosition.value)
      nextTick(() => {
        setTimeout(() => {
          // scroll to the specified element
          const targetElement = document.getElementById(elementId)
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' })
          }
          savedScrollPosition.value = 0 // Reset after restoration
        }, 250) // 250ms delay to ensure content is loaded
      })
    }
  }

  return {
    savedScrollPosition,
    restoreScrollPosition
  }
}
