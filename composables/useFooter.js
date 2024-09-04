export const useFooter = () => {
  const footerPrimary = useState('footerPrimary', () => {})
  const footerSock = useState('footerSock', () => {})
  const footerLinks = useState('footerLinks', () => {})
  const setFooter = (store) => {
    console.log('set footer', import.meta.server)
    console.log('setFooter', store, footerPrimary.value || 'None!')
    if (!footerPrimary.value) {
      footerPrimary.value = store.footerPrimary
    }
    if (!footerSock.value) {
      footerSock.value = store.footerSock
    }
    if (!footerLinks.value) {
      footerLinks.value = store.footerLinks
    }
  }
  return {
    footerPrimary,
    footerLinks,
    footerSock,
    setFooter
  }
}
