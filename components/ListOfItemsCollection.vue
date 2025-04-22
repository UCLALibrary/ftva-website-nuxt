<script lang="ts" setup>
import { computed, ref } from 'vue'
const attrs = useAttrs();
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
</script>
<template>
  <main>
    <div class="page page-article-list">
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
          :rich-text-content="$attrs.page.ftvaHomepageDescription"
        />
        <DividerWayFinder />
      </SectionWrapper>

      <!-- <SectionWrapper>
        <BlockTag
          data-test="total-results"
          :label="parsedCarouselData[slotProps.selectionIndex]?.creditText"
        />
        <SectionTeaserCard />
        <SectionPagination
          v-if="totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
        />
      </SectionWrapper> -->
    </div>
  </main>
</template>
<style lang="scss" scoped>
// .ftva.section-pagination {
//   margin-inline: auto;
//   padding: 2.5%;
// }</style>
