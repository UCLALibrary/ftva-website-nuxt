export const useHeader = () => {
  const header = useState('header', () => {})

  const setHeader = (store) => {
    console.log('set header', import.meta.server)
    console.log('setHeader', store, header.value || 'None!')
    if (!header.value) {
      header.value = store.header
    }
  }
  return {
    header,
    setHeader
  }
}
