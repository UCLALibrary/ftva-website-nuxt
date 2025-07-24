<script setup lang="ts">
import type { NuxtError } from '#app'

// IMAGE
import ErrorImage from 'ucla-library-design-tokens/assets/svgs/graphic-ftva-error-no-signal.svg'

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
      <SectionWrapper
        theme="paleblue"
        class="error-wrapper"
      >
        <h2
          v-if="isDevelopment"
          class="actual-error"
        >
          Error Message
        </h2>

        <h3
          v-if="isDevelopment"
          class="actual-error"
        >
          <pre>{{ error?.message }}</pre>
          <br>
        </h3>

        <divider-way-finder v-if="isDevelopment" />

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

        <divider-way-finder v-if="isDevelopment" />

        <div class="user-error-display">
          <ErrorImage />
          <h1
            v-if="error?.statusCode === 404"
            class="error-title"
          >
            <span class="blue-accent">404</span> Page not found
          </h1>
          <h1
            v-else
            class="error-title"
          >
            An error occurred
          </h1>

          <p class="body-text">
            We can’t find the page you are looking for. Please try using the navigation or search above. If you need
            further assistance, please <nuxt-link
              class="link"
              to="/contact"
            >contact us</nuxt-link>.
          </p>
        </div>
      </SectionWrapper>
    </main>
  </NuxtLayout>
</template>

<style lang="scss" scoped>
.page-error {
  padding: var(--space-3xl) var(--unit-gutter);
  background-color: var(--pale-blue);

  .error-wrapper {
    div.user-error-display {
      text-align: center;
      max-width: 580px;

      h1 {
        @include ftva-h2;
        padding-top: 40px;
      }

      .blue-accent {
        color: $accent-blue;
      }

      p.body-text {
        @include ftva-body-2;
        font-size: 18px;
        color: var(--dark-navy);
        padding-top: 8px;
      }

      .link {
        &:hover {
          color: $accent-blue;
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
