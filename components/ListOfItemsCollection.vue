<script lang="ts" setup>
import { computed, ref } from 'vue'
const attrs = useAttrs()
const route = useRoute()

// This is creating an index of the main content(not related content)
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

// "STATE"
const currentPage = ref(1)
const documentsPerPage = 15 // show 15 search results at a time 
const totalPages = ref(3)
const totalResults = ref(27)
const isMobile = ref(false)

const totalResultsDisplay = computed(() => {
  return totalResults.value + ' Video Clips'
})

useHead({
  title: attrs.page ? attrs.page.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(attrs.page.ftvaHomepageDescription)
    }
  ]
})
</script>
<template>
  <main>
    <div class="page page-collections-list-of-items">
      <NavBreadcrumb
        data-test="breadcrumb"
        class="breadcrumb"
        :title="$attrs.page.title"
        to="/collections"
      />
      <!-- TODO scrollElem used for infinite scrolling -->
      <SectionWrapper
        ref="scrollElem"
        :section-title="$attrs.page.title"
        class="header"
        theme="paleblue"
        data-test="complex-collections-page-title"
      >
        <RichText
          v-if="$attrs.page?.ftvaHomepageDescription"
          class="description"
          :rich-text-content="$attrs.page.ftvaHomepageDescription"
        />
        <DividerWayFinder />

        <span class="search-filters">
          some text
          <BlockTag
            data-test="total-results"
            class="total-results"
            :label="totalResultsDisplay"
          />
        </span>
        <!-- <SectionTeaserCard /> -->
        <SectionPagination
          v-if="totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper>
    </div>
  </main>
</template>
<style lang="scss" scoped>
.page-collections-list-of-items {

  .section-wrapper {
    .section-header {
      text-align: center;
    }

    :deep(h2.section-header.section-header2.section-title) {
      color: $heading-grey;
      text-align: center;
    }

    div.description {
      max-width: 964px;
    }

    .search-filters {
      display: flex;
      width: 100%;
      gap: 12px;
      justify-content: flex-start;
      margin-bottom: 2rem;

      .total-results {
        background-color: #132941; // navyblue
        margin-left: auto; // pins the total results to the right
      }
    }

    // :deep(.section-pagination) {
    //   margin-inline: auto;
    //   padding: 2.5%;
    // }
  }
}
</style>
