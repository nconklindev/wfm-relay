<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { AlertCircle, Info, TriangleAlert } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { alertVariants } from '.'
import type { AlertVariants } from '.'

const props = defineProps<{
  variant?: AlertVariants['variant']
  class?: HTMLAttributes['class']
}>()

const icon = computed(() => {
  switch (props.variant) {
    case 'warning':
      return TriangleAlert
    case 'error':
      return AlertCircle
    default:
      return Info
  }
})
</script>

<template>
  <div
    data-slot="alert"
    role="alert"
    :class="cn(alertVariants({ variant }), props.class)"
  >
    <component :is="icon" class="h-4 w-4" aria-hidden="true" />
    <div><slot /></div>
  </div>
</template>
