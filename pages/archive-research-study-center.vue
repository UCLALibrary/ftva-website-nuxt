<template>
  <ARSCIMCSSection
    section-handle="ftvaArchiveResearchAndStudyCenter"
    canonical-path="/archive-research-study-center"
  />
</template>

<style lang="scss" scoped>
@import 'assets/styles/slug-pages.scss';

.archive-research-study-center {
  .one-column {

    // if the layout has an image or carousel at the top
    &:has(> .lightbox-container),
    &:has(> figure) {
      padding-top: 80px; // to account for the missing pageanchor on this layout
    }
  }

  .flexible-content {
    :deep(div:last-of-type .section-wrapper3) {
      margin-bottom: 0;
    }
  }

  /* remove max-width from rich-text inside flexible-blocks for ftva */
  :deep(.flexible-block) {
    .rich-text {
      max-width: none;
      padding-right: 0px;
      h3 {
        @include ftva-fpb-rich-text-h3;
      }
      h4 {
        @include ftva-fpb-rich-text-h4;
      }
      h5 {
        @include ftva-fpb-rich-text-h5;
      }
      ol, ul {
        padding: 0;
      }
      ul {
        li {
          @include ftva-fpb-rich-text-li;
        }
      }
    }
  }
}
</style>
