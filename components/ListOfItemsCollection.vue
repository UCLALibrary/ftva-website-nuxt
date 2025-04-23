<script lang="ts" setup>
// import { useCollectionAggregator } from '../composables/useCollectionAggregator'
import config from '~/utils/searchConfig'

const attrs = useAttrs() as { page?: { title: string, ftvaFilters: string[] } }
const route = useRoute()

if (attrs.page && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the collection data using the composable during static build
    await indexContent(attrs.page, route.params.slug)
    // console.log('Collection indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION during static build:', error)
  }
}
useHead({
  title: attrs.page ? attrs.page.title : '... loading',
  // meta: [
  //   {
  //     hid: 'description',
  //     name: 'description',
  //     content: removeTags(attrs.page.text)
  //   }
  // ]
})
const collectionTitle = ref(attrs.page.title || '')
interface AggregationBucket {
  key: string
  doc_count: number
}

interface Aggregations {
  [key: string]: { buckets: AggregationBucket[] }
}
const ftvaFilters = ref(attrs.page.ftvaFilters || [])

function parseESConfigFilters(configFilters, ftvaFiltersArg) {
  console.log('configFilters', configFilters)
  console.log('ftvaFilters', ftvaFiltersArg)
  const parsedfilters = []
  for (const ftvaFilter of ftvaFiltersArg) {
    const filter = configFilters.find(filter => filter.craftFieldValue === ftvaFilter)
    if (filter) {
      parsedfilters.push(filter)
    }
  }
  return parsedfilters
}
const searchFilters = ref([])
function parseAggRes(response: Aggregations) {
  const filters = (Object.entries(response) || []).map(([key, value]) => ({
    label: key,
    options: value.buckets.map(bucket => ({
      label: bucket.key,
      value: bucket.key
    }))
  }))
  return filters
}
// fetch filters for the page from ES after page loads in Onmounted hook on the client side
async function setFilters() {
  const parsedESConfigFiltersRes = parseESConfigFilters(config.collection.filters, ftvaFilters.value)

  const searchAggsResponse: Aggregations = await useCollectionAggregator(
    parsedESConfigFiltersRes,
    'ftvaCollectionInItem',
    collectionTitle.value // change it what is being used on this page template
  )

  console.log('Search Aggs Response: ' + JSON.stringify(searchAggsResponse))
  // searchFilters.value is just a place holder which will have all the
  // filter data for single select drop down in [{ label}]
  searchFilters.value = parseAggRes(
    searchAggsResponse
  )
}
onMounted(async () => {
  // console.log('onMounted called')

  await setFilters()
})
</script>
<template>
  <main>
    WELCOME TO LIST OF ITEMS COLLECTION PAGE
    <div
      v-for="(filter, index) in searchFilters"
      :key="index"
    >
      <label
        v-if="filter.label"
        :for="filter.label"
        class="select-label"
      >
        {{ filter.label }}
      </label>
      <select
        :id="filter.label"
        :name="filter.label"
        class="select-input"
      >
        <option
          disabled
          value=""
        >
          -- Select an option --
        </option>
        <option
          v-for="option in filter.options"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>
  </main>
</template>
<style lang="scss" scoped></style>
