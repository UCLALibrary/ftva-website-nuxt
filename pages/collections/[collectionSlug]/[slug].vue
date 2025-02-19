<script setup>
import { CardMeta, DividerWayFinder, NavBreadcrumb, ResponsiveImage, ResponsiveVideo, SectionWrapper, TwoColLayoutWStickySideBar, VideoEmbed } from 'ucla-library-website-components'

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

console.log('Data: ', data.value)

const page = ref(_get(data.value, 'entry', {}))
const relatedContent = ref(_get(data.value, 'entries', {}))

console.log('Page: ', page.value)

watch(data, (newVal, oldVal) => {
  // console.log('In watch preview enabled, newVal, oldVal', newVal, oldVal)
  page.value = _get(newVal, 'entry', {})
  relatedContent.value = _get(newVal, 'entries', {})
})

const parsedMainContent = computed(() => {

})

const parsedMediaContent = computed(() => {
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

  return filteredRelatedContent.slice(0, 3)
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
    <div class="header">
      <NavBreadcrumb
        class="breadcrumb"
        :title="page?.title"
      />
    </div>

    <TwoColLayoutWStickySideBar
      data-test=""
      class="two-column"
    >
      <template #primaryTop>
        <CardMeta
          :title="page?.title"
          category="LA Rebellion"
        >
          <!-- <template #linkedcategoryslot>
            <NuxtLink :to="">
              {{ page?.title }}
            </NuxtLink>
          </template> -->
        </CardMeta>
      </template>

      <template #primaryMid>
        <ResponsiveVideo
          v-if="parsedMediaContent"
          :aspect-ratio="56.9"
          :controls="true"
        >
          <template #default>
            <VideoEmbed
              :trailer="parsedMediaContent"
              :poster-image="page.ftvaImage[0]"
            />
          </template>
        </ResponsiveVideo>
        <ResponsiveImage
          v-else
          :media="page.ftvaImage[0]"
        />
        <h2
          v-if="page?.richText"
          class=""
        >
          Sypnosis
        </h2>
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
        <pre>{{ parsedCredits }}</pre>
      </template>
    </TwoColLayoutWStickySideBar>

    <SectionWrapper />
    <!-- <section-wrapper>
      <h2>Collection Item</h2>
      <pre>{{ page }}</pre>
      <divider-general />
      <h2>Related Content</h2>
      <div
        v-for="item in parsedRelatedContent"
        :key="item.id"
      >
        <NuxtLink :to="`/${item.uri}`">
          <h4>Title-Link: {{ item.title }}</h4>
        </NuxtLink>
        <p>uri: {{ item.uri }}</p>
        <p>id: {{ item.id }}</p>
        <p>image: {{ item.ftvaImage[0] }}</p>
        <divider-general />
      </div>
    </section-wrapper> -->
  </main>
</template>

<style lang="scss" scoped>
.page-collection-item-detail {
  position: relative;

  .header {
    background-color: var(--pale-blue);
    padding-block: 0.5rem;
  }
}

@import 'assets/styles/slug-pages.scss';
</style>
