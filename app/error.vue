<script setup lang="ts">
import type { NuxtError } from '#app'
import { CircleAlert, FileQuestion, ServerCrash, ShieldX } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const props = defineProps<{ error: NuxtError }>()

const colorMode = useCookie('wfm-color-mode', { default: () => 'dark' })
useHead(() => ({
  htmlAttrs: { class: colorMode.value !== 'light' ? 'dark' : '' },
  meta: [{ name: 'robots', content: 'noindex' }],
}))
useSeoMeta({
  title: computed(() => errorConfig.value.title),
})

const statusCode = computed(() => Number(props.error.status) || 500)

const errorConfig = computed(() => {
  switch (statusCode.value) {
    case 404:
      return {
        icon: FileQuestion,
        title: 'Page Not Found',
        message: "Looks like this page took a wrong turn. It may have been moved or never existed.",
      }
    case 401:
      return {
        icon: ShieldX,
        title: 'Unauthorized',
        message: "Hold on — you'll need to authenticate before you can access this.",
      }
    case 403:
      return {
        icon: ShieldX,
        title: 'Access Denied',
        message: "This area is off-limits. You don't have permission to view this page.",
      }
    case 500:
      return {
        icon: ServerCrash,
        title: 'Server Error',
        message: "Oops — something broke on our end. It's not you, it's us.",
      }
    default:
      return {
        icon: CircleAlert,
        title: 'Something Went Wrong',
        message: props.error.message || 'An unexpected error occurred.',
      }
  }
})

function goBack() {
  history.back()
}

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground text-center px-4 sm:px-6">
    <component
      :is="errorConfig.icon"
      class="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground"
      aria-hidden="true"
    />

    <p class="mb-1 text-3xl sm:text-5xl font-bold text-primary">
      {{ statusCode }}
    </p>

    <h1 class="mb-2 text-3xl sm:text-5xl font-semibold">
      {{ errorConfig.title }}
    </h1>

    <p class="mb-8 max-w-sm text-base sm:text-lg text-muted-foreground">
      {{ errorConfig.message }}
    </p>

    <div class="flex flex-col w-full gap-3 sm:flex-row sm:w-auto sm:gap-4">
      <Button variant="outline" class="w-full sm:w-auto" @click="goBack">
        Go Back
      </Button>
      <Button class="w-full sm:w-auto" @click="goHome">
        Go Home
      </Button>
    </div>

    <p
      v-if="error.message && statusCode >= 500"
      class="mt-8 max-w-[280px] sm:max-w-sm truncate font-mono text-xs text-muted-foreground"
      :title="error.message"
    >
      {{ error.message }}
    </p>
  </div>
</template>
