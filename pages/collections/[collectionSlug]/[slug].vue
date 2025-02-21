<script setup>
import { CardMeta, DividerWayFinder, NavBreadcrumb, ResponsiveImage, ResponsiveVideo, SectionWrapper, TableComponent, TableRow, TwoColLayoutWStickySideBar, VideoEmbed } from 'ucla-library-website-components'

// HELPERS
import _get from 'lodash/get'

// GQL
import { vi } from 'vuetify/locale'
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

console.log('Route: ', route)

console.log('Data: ', data.value)

const page = ref(_get(data.value, 'entry', {}))
const relatedContent = ref(_get(data.value, 'entries', {}))

console.log('Page: ', page.value)

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  relatedContent.value = _get(newVal, 'entries', {})
})

const parsedCollectionItemMedia = computed(() => {
  if (!page.videoEmbed) {
    return null
  }

  // return '<figure><iframe width="560" height="315" src="https://www.youtube.com/embed/uYr_SvIKKuI?si=ihenbmyE91KqyXK5" title="YouTube video player" frameborder="0"></iframe></figure>'
})

const parsedCredits = computed(() => {
  if (page.value.associatedIndividuals.length === 0) {
    return null
  }

  const credits = page.value.associatedIndividuals.map((obj) => {
    const firstname = obj.individual[0].nameFirst
    const lastname = obj.individual[0].nameLast
    let fullname

    if (!lastname) {
      fullname = firstname
    } else if (!firstname) {
      fullname = lastname
    } else {
      fullname = `${firstname} ${lastname}`
    }

    return {
      name: fullname,
      role: obj.roles,
    }
  })

  return credits
})
console.log('Parsed Credits: ', parsedCredits.value)

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
console.log('Parsed Related Content: ', parsedRelatedContent.value)

const parsedParentRoute = computed(() => {
  const parentRoute = route.path.replace(`/${slug}`, '')

  const parentRouteTitle = collectionSlug.replaceAll('-', ' ').toUpperCase()

  return { parentRoute, parentRouteTitle }
})
console.log('Parsed Parent Route: ', parsedParentRoute.value)

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
      />
    </div>

    <TwoColLayoutWStickySideBar
      data-test=""
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
          v-if="parsedCollectionItemMedia"
          :aspect-ratio="56.9"
          :controls="true"
        >
          <template #default>
            <VideoEmbed
              :trailer="parsedCollectionItemMedia"
              :poster-image="page.ftvaImage[0]"
            />
          </template>
        </ResponsiveVideo>
        <ResponsiveImage
          v-else
          :media="page.ftvaImage[0]"
        />
      </template>

      <template #sidebarTop>
        <h2>Metadata Column</h2>
      </template>

      <template #primaryMid>
        <h3
          v-if="page?.richText"
          class="collection-item-subtitle synopsis"
        >
          Sypnosis
        </h3>
        <RichText
          v-if="page?.richText"
          class="eventDescription"
          :rich-text-content="page?.richText"
        />
      </template>

      <template
        v-if="parsedCredits"
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
            v-for="item, index in parsedCredits"
            :key="index"
            :num-cells="2"
          >
            <template #column1>
              <span class="credit-table__name">
                {{ item.name }}
              </span>
            </template>
          </TableRow>
        </TableComponent>
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper
      v-if="parsedRelatedContent && parsedRelatedContent.length > 0"
      section-title="More from this topic"
      theme="paleblue"
      class="collection-item-section-wrapper"
    >
      <template #top-right>
        <Nuxtlink :to="`${parsedParentRoute.parentRoute}`">
          Back to {{ parsedParentRoute.parentRouteTitle }}<span style="font-size:1.5em;">
            &#8250;</span>
        </Nuxtlink>
      </template>

      <SectionTeaserCard
        v-if="parsedRelatedContent && parsedRelatedContent.length > 0"
        data-test="related-content"
        :items="parsedRelatedContent"
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

    :deep(.title-no-link) {
      margin: 0;
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

  .ftva.card-meta :deep(.category) {
    color: var(--subtitle-grey);
  }

  .collection-item-subtitle {
    color: $heading-grey;
    font-size: 40px;
    font-weight: 800;

    &.synopsis {
      margin-top: var(--space-m);
    }

    &.synopsis,
    &.credits {
      margin-bottom: var(--space-s);
    }
  }

  .collection-item-section-wrapper {
    margin-top: var(--space-l);
  }

  .credit-table__name {
    font-size: 30px;
  }

  @media(max-width: 1200px) {
    .collection-item-header .breadcrumb {
      padding-left: var(--unit-gutter);
    }
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
