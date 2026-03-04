<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const colorMode = useCookie('wfm-color-mode', { default: () => 'dark' })
const isDark = computed(() => colorMode.value !== 'light')

useHead(() => ({
  htmlAttrs: { class: isDark.value ? 'dark' : '' },
}))

function toggleColorMode() {
  colorMode.value = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <!-- Skip navigation link for keyboard/screen reader users -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none"
    >
      Skip to main content
    </a>

    <header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div class="mx-auto flex h-14 items-center justify-between gap-2 px-4 sm:px-6">
        <NuxtLink
          to="/"
          class="rounded font-semibold tracking-tight transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label="WFM Relay home"
        >
          WFM Relay
        </NuxtLink>

        <div class="flex items-center gap-1">
          <nav aria-label="Main navigation">
            <ul class="m-0 flex list-none items-center gap-1 p-0">
              <li>
                <NuxtLink to="/" active-class="text-accent" class="inline-flex items-center px-2 py-2 min-h-11">Home</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/about" active-class="text-accent" class="inline-flex items-center px-2 py-2 min-h-11">About</NuxtLink>
              </li>
            </ul>
          </nav>

          <button
            type="button"
            class="rounded-md p-2.5 min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleColorMode"
          >
            <Sun v-if="isDark" class="h-5 w-5" aria-hidden="true" />
            <Moon v-else class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <main
      id="main-content"
      tabindex="-1"
      class="mx-auto w-full flex-1 px-4 py-8 sm:px-6 focus-visible:outline-none"
    >
      <slot />
    </main>

    <BackToTop />

    <footer class="border-t">
      <div class="flex flex-col justify-center items-center gap-1 px-4 py-4 sm:px-6">
        <p class="text-center text-xs text-muted-foreground">WFM Relay</p>
        <NuxtLink
          to="https://github.com/nconklindev/wfm-relay"
          class="inline-flex items-center px-2 py-1.5 min-h-11 text-xs text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>
