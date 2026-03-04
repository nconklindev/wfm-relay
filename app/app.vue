<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt'

useHeadSafe({
  titleTemplate: (chunk) => chunk ? `${chunk} — WFM Relay` : 'WFM Relay',
})
</script>


<template>
  <Analytics />
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
