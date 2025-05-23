<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: {
    type: Object as () => NuxtError,
    default: () => ({ statusCode: 500, message: 'An unexpected error occurred' }),
  },
})

const isDevelopment = computed(() => import.meta.dev)
</script>

<template>
  <NuxtLayout :is-error="true">
    <main
      id="main"
      class="page page-error"
    >
      <SectionWrapper>
        <p class="error">
          {{ error?.statusCode }}
        </p>

        <h2
          v-if="isDevelopment"
          class="actual-error"
        >
          Error Mesage
        </h2>

        <h3
          v-if="isDevelopment"
          class="actual-error"
        >
          <pre>{{ error?.message }}</pre>
          <br>
        </h3>

        <divider-way-finder />

        <h2
          v-if="isDevelopment"
          class="error-message"
        >
          Error
        </h2>
        <h3
          v-if="isDevelopment"
          class="error-message"
        >
          <pre>{{ error }}</pre>
        </h3>

        <divider-way-finder />

        <rich-text
          class="
        error-text"
        >
          <h1
            v-if="error?.statusCode === 404"
            class="error-title"
          >
            Page not found
          </h1>
          <h1
            v-else
            class="error-title"
          >
            An error occurred
          </h1>

          <p>
            We can’t find the page you are looking for, but we're here to help. <nuxt-link to="/">
              Go back to home
              page
            </nuxt-link> or try these regularly visited links:
          </p>
          <ul>
            <li><a href="https://library.ucla.edu">UCLA Library Home</a></li>
            <li><a href="https://www.library.ucla.edu/research-teaching-support/research-help">Research Help</a></li>
            <li>
              <a href="https://www.library.ucla.edu/use/access-privileges/disability-resources">Accessibility
                Resources</a>
            </li>
          </ul>
        </rich-text>
      </SectionWrapper>
    </main>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.page-error {
  padding: var(--space-3xl) var(--unit-gutter);

  .error {
    font-family: var(--font-secondary);
    font-size: 248px;
    font-weight: 600;
    line-height: 1;
    background: linear-gradient(20deg,
        #fd9be0 10.99%,
        #e29aee 23.02%,
        #c099ff 32.91%,
        #8ba0ef 42.44%,
        #0aa5ff 56.68%,
        #06bef2 73.09%,
        #00e0e0 89.01%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-fill-color: transparent;
    text-align: center;
  }

  .error-title {
    @include step-5;
    margin-bottom: 32px;

    p {
      margin-bottom: var(--space-xl);
    }
  }

  pre {
    white-space: pre-wrap;
    overflow-x: auto;
  }

  @media #{$small} {
    .error {
      font-size: 128px;
    }
  }
}
</style>
