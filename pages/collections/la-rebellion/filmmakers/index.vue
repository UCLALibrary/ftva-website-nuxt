<script lang="ts" setup>
import { computed } from 'vue'

// HELPERS & UTILS
import _get from 'lodash/get'
import removeTags from '~/utils/removeTags'
import parseFieldForBreadcrumbTitleOverride from '~/utils/parseBreadcrumbTitles'

// GQL
import FTVALARebellionFilmmakersList from '~/gql/queries/FTVALARebellionFilmmakersList.gql'

const { $graphql } = useNuxtApp()

const { data, error } = await useAsyncData('la-rebellion-filmmakers', async () => {
  const data = await $graphql.default.request(FTVALARebellionFilmmakersList)
  return data
}) as { data: Ref<{ entry: any } | null>, error: Ref<any> }

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  // console.log('no data')
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()

    const doc = {
      title: data.value.entry.title,
      titleSort: normalizeTitleForAlphabeticalBrowseBy(data.value.entry.title),
      text: data.value.entry.summary,
      uri: '/collections/la-rebellion/filmmakers/',
      sectionHandle: data.value.entry.sectionHandle,
      groupName: 'Collections',
    }

    // Index the event data using the composable during static build
    await indexContent(doc, 'filmmaker-listing')

    // console.log('Article indexed successfully during static build')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX FILMMAKER LISTING during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
})

// PAGE SUMMARY
const showPageSummary = computed(() => {
  return page.value?.summary && page.value?.displaySummary === 'yes'
})

useHead({
  title: page.value ? page.value.title : '... loading',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: removeTags(page.value.summary)
    }
  ]
})

// "STATE"
const documentsPerPage = 12
const selectedSortFilters = ref({ sortField: 'nameLast.keyword asc' })

const filmmakersFetchFunction = async (page) => {
  const { paginatedFilmmakersQuery } = useFilmmakersListSearch()
  // parse the sort field
  const sortOnField = selectedSortFilters.value.sortField?.split(' ')[0]
  const orderBy = selectedSortFilters.value.sortField?.split(' ')[1]
  const results = await paginatedFilmmakersQuery(
    page,
    documentsPerPage,
    sortOnField,
    orderBy,
    ['*']
  )
  return results
}

const onResults = (results) => {
  if (results?.hits?.hits?.length > 0) {
    const newListings = results.hits.hits || []

    if (isMobile.value) {
      totalPages.value = 0
      mobileItemList.value.push(...newListings)
      hasMore.value = currentPage.value < Math.ceil(results.hits.total.value / documentsPerPage)
    } else {
      desktopItemList.value = newListings
      totalPages.value = Math.ceil(results.hits.total.value / documentsPerPage)
    }
  } else {
    totalPages.value = 0
    hasMore.value = false
  }
}

// INFINITE SCROLL
const { isLoading, isMobile, hasMore, desktopItemList, mobileItemList, totalPages, currentPage, currentList, scrollElem, searchES } = useMobileOnlyInfiniteScroll(filmmakersFetchFunction, onResults)

const route = useRoute()

// PAGINATION SCROLL HANDLING
// // Element reference for the scroll target
const resultsSection = ref(null)
// usePaginationScroll composable
const { scrollTo } = usePaginationScroll()

watch(() => route.query, async (newVal, oldVal) => {
  // console.log('onPageChange called in filmmakers page')
  isLoading.value = false
  currentPage.value = route.query.page ? parseInt(route.query.page) : 1
  isMobile.value ? mobileItemList.value = [] : desktopItemList.value = []
  hasMore.value = true

  await searchES()
  // Restore scroll position
  // // Scroll after DOM updates
  await nextTick()
  if (!isMobile.value && route.query.page && resultsSection.value && parsedFilmmakerListings.value.length > 0) {
    await scrollTo(resultsSection)
  }
}, { deep: true, immediate: true })

// COMPUTED LISTINGS
const parsedFilmmakerListings = computed(() => {
  if (currentList.value.length === 0) return []

  return currentList.value.map((obj) => {
    let filmmakerDescription

    if (!isMobile.value) {
      filmmakerDescription = obj._source.richText
    } else {
      filmmakerDescription = null
    }

    return {
      to: `/${obj._source.to}`,
      title: obj._source.title,
      description: filmmakerDescription,
      image: parseImage(obj),
    }
  })
})

// SORT
const sortDropdownData = {
  // note: 'nameLast' and 'title' are fields on the indexed ftvaLARebellionIndividual object that we are sorting on
  options: [
    { label: 'Last Name (A - Z)', value: 'nameLast.keyword asc' },
    { label: 'Last Name (Z - A)', value: 'nameLast.keyword desc' },
    { label: 'First Name (A - Z)', value: 'title.keyword asc' },
    { label: 'First Name (Z - A)', value: 'title.keyword desc' },
  ],
  label: 'Sort by',
  fieldName: 'sortField'
}

const router = useRouter()

function updateSort(newSort) {
  router.push({
    path: route.path,
    query: {
      filters: route.query.filters,
      sort: newSort.sortField,
      page: route.query.page
    }
  })
}

const pageClasses = computed(() => {
  return ['page', 'page-filmmakers', 'page-bottom-spacer']
})

// BREADCRUMB OVERRIDES
const parseBreadcrumbTitle = computed(() => {
  if (page.value.sectionHandle === 'ftvaListingLaRebellionFilmmakers') {
    return 'L.A. Rebellion'
  }

  return null
})

const breadcrumbOverrides = ref([
  {
    titleLevel: 2,
    updatedTitle: parseBreadcrumbTitle
  }
])
</script>

<template>
  <main
    id="main"
    :class="pageClasses"
  >
    <div class="one-column">
      <NavBreadcrumb
        data-test="breadcrumb"
        :override-title-group="breadcrumbOverrides"
      />

      <SectionWrapper
        ref="scrollElem"
        :level="1"
        class="header"
        :section-title="page.title"
        :section-summary="showPageSummary ? page.summary : ''"
        theme="paleblue"
        data-test="page-heading"
      >
        <DividerWayFinder />
        <div
          ref="resultsSection"
          class="for-pagination-scroll"
        />
        <div
          v-if="parsedFilmmakerListings.length"
          class="sort-fields"
        >
          <DropdownSingleSelect
            v-model:selected-filters="selectedSortFilters"
            :label="sortDropdownData.label"
            :options="sortDropdownData.options"
            :field-name="sortDropdownData.fieldName"
            @update-display="(newSort) => {
              updateSort(newSort)
            }"
          />
        </div>

        <SectionStaffArticleList
          :items="parsedFilmmakerListings"
          data-test="page-listings"
        />

        <SectionPagination
          v-if="
            totalPages !== 1 && !isMobile"
          :pages="totalPages"
          :initial-current-page="currentPage"
          :fixed-page-width-mode="true"
          :fixed-page-width-num="10"
        />
      </SectionWrapper>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@import 'assets/styles/listing-pages.scss';

.page-filmmakers {
  position: relative;
  background-color: var(--pale-blue);

  .section-wrapper {
    padding-inline: 0;
    padding-bottom: 0;

    :deep(.section-title) {
      @include ftva-h5;
      color: $heading-grey;
    }

    :deep(.section-summary) {
      margin-inline: 0;
      max-width: 100%;
    }
  }

  :deep(.section-pagination) {
    background-color: white;
    padding: 15px 2.5% 60px;
    justify-content: center;
  }

  .sort-fields {
    width: 100%;
    margin-bottom: 2rem;

    :deep(.button-dropdown-modal-wrapper.is-expanded) {
      z-index: 5;
    }
  }

  @media #{$medium} {
    .section-wrapper {
      :deep(div.section-header) {
        margin-bottom: var(--space-xl);
      }
    }
  }

  @media #{$small} {

    :deep(.dropdown-single-select),
    :deep(.dropdown-single-select .mobile-button) {
      width: 100%;
    }

    .ftva.section-staff-article-list {
      background-color: var(--color-white);
      padding: 24px;
      margin-inline: auto;
    }
  }

  :deep(.ftva.block-staff-article-item) {
    --image-min-width: 180px;
    --image-aspect-ratio: 1;

    .image {
      height: var(--image-min-width);
    }

    .ftva-description {
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
  }

  @media #{$small} {
    :deep(.ftva.section-staff-article-list) {
      padding: 16px;

      .ftva.block-staff-article-item {
        flex-direction: row;
        border-bottom: 1px solid #e7edf2;
        border-radius: 0;
        padding-bottom: var(--space-xl);
        margin-bottom: var(--space-xl);

        .molecule-no-image,
        .image {
          min-width: 100px;
          max-width: 100px;
          height: 100px;
          margin-right: var(--space-l);
          margin-bottom: 0;
        }

        .media {
          border-radius: 0;
        }

        .meta {
          width: calc(60% - var(--space-xl));
          padding: 0;
          height: unset;
        }

        .title {
          font-size: 21px;
          line-height: 1.2;
        }

        .ftva-description {
          display: none;
        }
      }
    }
  }
}
</style>
