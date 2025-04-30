<script setup lang="ts">
// HELPERS
import _get from 'lodash/get'

// GQL
import FTVACollectionItem from '../gql/queries/FTVACollectionItem.gql'

// COMPOSABLE
import { useContentIndexer } from '~/composables/useContentIndexer'

const { $graphql } = useNuxtApp()

const route = useRoute()

const { collectionSlug, slug } = route.params

// DATA
const { data, error } = await useAsyncData(`collection-item-${slug}`, async () => {
  const data = await $graphql.default.request(FTVACollectionItem, { slug, collectionSlug })
  return data
})

if (error.value) {
  throw createError({
    ...error.value, statusMessage: 'Page not found.' + error.value, fatal: true
  })
}

if (!data.value.entry) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true
  })
}

// This is creating an index of the main content (not related content)
if (data.value.entry && import.meta.prerender) {
  try {
    // Call the composable to use the indexing function
    const { indexContent } = useContentIndexer()
    // Index the data using the composable during static build
    await indexContent(data.value.entry, slug)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('FAILED TO INDEX COLLECTION ITEM during static build:', error)
  }
}

const page = ref(_get(data.value, 'entry', {}))
const relatedContent = ref(_get(data.value, 'entries', {}))

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  relatedContent.value = _get(newVal, 'entries', {})
})

// TYPES
interface LinkedIndividual {
  name: string
  uri: string
}

interface Metadata {
  Date?: string
  'Release Date'?: string
  'Episode Air Date'?: string
  'Episode Title'?: string
  'Episode Season'?: string
  'Episode Number'?: string
  'Collection Group'?: string[]
  Tags?: string[]
  Director?: LinkedIndividual[],
  Year?: string
  Country?: string
  Runtime?: string
}

const parsedMetadataList = computed((): Metadata => {
  // Metadata comes through as individual fields that have to be consolidated
  const collectedMetadata = {
    Date: page.value.ftvaDate,
    ftvaSortDate: page.value.ftvaSortDate,
    'Release Date': page.value.releaseDate,
    'Episode Air Date': page.value.episodeAirDate,
    'Episode Title': page.value.episodeTitle,
    'Episode Season': page.value.episodeSeason,
    'Episode Number': page.value.episodeNumber,
    'Collection Group': getObjectValue(page.value.ftvaCollectionGroup, 'title'),
    Tags: getObjectValue(page.value.ftvaCollectionTags, 'title'),
    Director: getLinkedIndividual(page.value.director),
    Year: page.value.year,
    Country: page.value.country,
    Runtime: page.value.runtime,
  }

  let nonNullMetadata = {}

  // Filter out fields with null/undefined value, empty array/object
  Object.entries(collectedMetadata).reverse().forEach(([key, value]) => {
    if (isNonNull(value)) {
      nonNullMetadata = { [key]: value, ...nonNullMetadata }
    }
  })

  return nonNullMetadata
})

// METADATA HELPERS
// Determine if object's value is null, undefined, empty
function isNonNull(value: any): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value) && value.length < 1) return false
  if (typeof value === 'object' && Object.keys(value).length === 0) return false
  return true
}

// Loop through array of objects, return values for a target/specified key as an array list
function getObjectValue(arr: {}[], key: string): string[] {
  if (arr.length === 0) return

  const keysList = arr.filter(obj => Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null)

  return keysList.map(obj => obj[key])
}

// Helper to reformat metadata for Director and AssociatedIndividuals
interface Individual {
  nameFirst?: string;
  nameLast?: string;
  uri?: string;
}

function getLinkedIndividual(arr: Individual[]) {
  const parsedPersonObj = arr.map((personObj) => {
    const firstname = personObj.nameFirst
    const lastname = personObj.nameLast
    let fullname: string

    if (!lastname) {
      fullname = firstname
    } else if (!firstname) {
      fullname = lastname
    } else if (firstname && lastname) {
      fullname = `${firstname} ${lastname}`
    }

    return {
      name: fullname,
      uri: personObj.uri
    }
  })

  return parsedPersonObj
}

const parsedCollectionItemCredits = computed(() => {
  const individuals = page.value.associatedIndividuals

  if (individuals.length === 0) {
    return null
  }

  const credits = individuals.map((item) => {
    const parsedNameAndUri = getLinkedIndividual(item.individual)[0]
    return { ...parsedNameAndUri, roles: item.roles }
  })

  const creditsWithNames = credits.filter(obj => obj.name !== null && obj.name !== undefined)

  return creditsWithNames.length > 0 ? creditsWithNames : null
})

// Entries query returns 4 random articles; main article might be included in the randomized return; to prevent duplication, filter out the main article; use remaining content in the related section.
const parsedRelatedContent = computed(() => {
  const mainContentId = page.value.id

  const filteredRelatedContent = relatedContent.value.filter(obj => obj.id !== mainContentId)

  return filteredRelatedContent.slice(0, 3).map((obj) => {
    return {
      image: obj.ftvaImage[0],
      title: obj.title,
      to: obj.slug,
      videoEmbed: obj.videoEmbed
    }
  })
})

const parsedParentRoute = computed(() => {
  const parentRoute = route.path.replace(`/${slug}`, '')

  const parentRouteTitle = (collectionSlug as string).replace(/-/g, ' ').toUpperCase()

  return { parentRoute, parentRouteTitle }
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

</script>

<template>
  <main
    id="main"
    class="page page-detail page-detail--white page-collection-item-detail"
  >
    <div class="collection-item-header">
      <NavBreadcrumb
        :title="page?.title"
        class="breadcrumb"
        data-test="breadcrumb"
      />
    </div>

    <TwoColLayoutWStickySideBar
      data-test="page-title"
      class="two-col-layout__title"
    >
      <template #primaryTop>
        <CardMeta :title="page?.title">
          <template #linkedcategoryslot>
            <NuxtLink :to="`${parsedParentRoute.parentRoute}`">
              {{ parsedParentRoute.parentRouteTitle }}
            </NuxtLink>
          </template>
        </CardMeta>
      </template>
    </TwoColLayoutWStickySideBar>

    <TwoColLayoutWStickySideBar
      data-test=""
      class="two-col-layout__body"
    >
      <template #primaryTop>
        <ResponsiveVideo
          v-if="page.videoEmbed"
          :aspect-ratio="56.9"
          :controls="true"
        >
          {{ page.videoEmbed }}
          <!-- TODO UNCOMMENT THIS AFTER THE DATA IS FIXED FOR PAGE.VIDEOEMBED IN CRAFT as we are getting 500 error-->
          <!--template #default>
            <VideoEmbed
              :trailer="page.videoEmbed"
              :poster-image="page.ftvaImage[0]"
            />
          </template-->
        </ResponsiveVideo>
        <ResponsiveImage
          v-else
          :media="page.ftvaImage[0]"
        />
      </template>

      <template #sidebarTop>
        <DefinitionList
          :meta-data-object="parsedMetadataList"
          data-test="metadata"
        >
          <!-- slot name must match field name in parsed metadata, case sensitive -->
          <template #definition-Director>
            <NuxtLink
              :key="parsedMetadataList.Director[0].name"
              :to="`/${parsedMetadataList.Director[0].uri}`"
              class="director-link"
            >
              {{ parsedMetadataList.Director[0].name }}
            </NuxtLink>
          </template>
          <template
            v-if="page.externalResourceUrl"
            #list-bottom
          >
            <ButtonLink
              label="View Catalog Record"
              :to="page.externalResourceUrl"
              :is-secondary="true"
              icon-name="none"
              class="centered-button"
            />
          </template>
        </DefinitionList>
      </template>

      <template
        v-if="page?.richText"
        #primaryMid
      >
        <h3 class="collection-item-subtitle synopsis">
          Sypnosis
        </h3>
        <RichText
          class="eventDescription"
          :rich-text-content="page?.richText"
        />
      </template>

      <template
        v-if="parsedCollectionItemCredits"
        #primaryBottom
      >
        <DividerWayFinder />

        <h3 class="collection-item-subtitle credits">
          Credits
        </h3>

        <TableComponent
          :table-headers="['Name', 'Role']"
          table-caption="Credits"
          color-scheme="paleblue"
        >
          <TableRow
            v-for="item, index in parsedCollectionItemCredits"
            :key="index"
            :num-cells="2"
          >
            <template #column1>
              <NuxtLink
                v-if="item.uri"
                class="credit-table__name"
                :to="`/${item.uri}`"
              >
                {{ item.name }}
              </NuxtLink>
              <span
                v-else
                class="credit-table__name"
              >
                {{ item.name }}
              </span>
            </template>
            <template #column2>
              <span>
                {{ item.roles }}
              </span>
            </template>
          </TableRow>
        </TableComponent>
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedRelatedContent && parsedRelatedContent.length > 0"
      section-title="More from this collection"
      theme="paleblue"
      class="collection-item-section-wrapper"
    >
      <template #top-right>
        <NuxtLink :to="`${parsedParentRoute.parentRoute}`">
          Back to {{ parsedParentRoute.parentRouteTitle }}<span style="font-size:1.5em;">
            &#8250;</span>
        </NuxtLink>
      </template>

      <SectionTeaserCard
        v-if="parsedRelatedContent && parsedRelatedContent.length > 0"
        data-test="related-content"
        :items="parsedRelatedContent"
        :grid-layout="false"
      />
    </SectionWrapper>
  </main>
</template>

<style lang="scss" scoped>
.page-collection-item-detail {
  position: relative;

  .collection-item-header {
    background-color: var(--pale-blue);
    padding-block: 0.5rem;

    .breadcrumb {
      padding: 0;
      max-width: var(--ftva-container-max-width)
    }
  }

  .two-col-layout__title {

    :deep(.primary-section-wrapper) {
      margin-bottom: var(--space-l);
    }

    :deep(.linked-category),
    :deep(.title-no-link) {
      margin: 0;
      color: var(--heading-grey);
    }

    :deep(.linked-category) {
      @include ftva-subtitle-1;
    }

    :deep(.title-no-link) {
      @include ftva-h2;
    }

    :deep(.sidebar-column) {
      display: none;
    }
  }

  .two-col-layout__body {
    :deep(.primary-section-wrapper) {
      margin-top: 0;
    }

    :deep(.sidebar-column) {
      padding-top: 0;
    }

    :deep(.sidebar-content-wrapper) {
      position: static;
      will-change: unset;
    }
  }

  .collection-item-section-wrapper {
    margin-top: var(--space-l);

    :deep(.section-title) {
      @include ftva-h4;
    }
  }

  .collection-item-subtitle {
    @include ftva-h3;
    color: $heading-grey;

    &.synopsis {
      margin-top: var(--space-m);
    }

    &.synopsis,
    &.credits {
      margin-bottom: var(--space-s);
    }
  }

  :deep(.definition-list-item-wrapper):is(:first-of-type) dt {
    padding-top: 0;
  }

  :deep(.definition-list-item-wrapper):not(:last-of-type) {
    margin-bottom: 16px;
  }

  .list-bottom-wrapper .button-link {
    width: 100%;
  }

  .director-link {
    text-transform: uppercase;
    text-decoration: underline;
    text-decoration-thickness: 3px;
    text-decoration-color: #abbfd6;
    text-underline-offset: 4px;

    &:hover {
      text-decoration-color: #2c91ff;
    }
  }

  .table-component :deep(thead) tr,
  .table-component .table-row {
    gap: 0;
  }

  .credit-table__name {
    font-size: 30px;
    color: $accent-blue;
  }

  @media(max-width: 1200px) {
    .collection-item-header .breadcrumb {
      padding-left: var(--unit-gutter);
    }
  }

  @media(max-width: 899px) {
    .two-col-layout__title {
      :deep(.primary-section-wrapper) {
        margin-bottom: 0;
      }
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
