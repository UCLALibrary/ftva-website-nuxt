import { useWindowScroll } from '@vueuse/core'
export default function usePaginationScroll() {
  const { y } = useWindowScroll({ behavior: 'smooth' })
  async function scrollTo(anchorRef: Ref<HTMLElement | null>): Promise<void> {
    await nextTick()
    if (import.meta.client && anchorRef?.value) {
      const top = anchorRef.value.getBoundingClientRect().top + window.scrollY - 300 y.value = top
    }
  }
  return { scrollTo }
}
