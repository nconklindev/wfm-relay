<script setup lang="ts">
  import { Analytics } from '@vercel/analytics/next';
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
