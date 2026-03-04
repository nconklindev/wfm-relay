<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink } from 'lucide-vue-next'

useSeoMeta({
  title: 'About',
  description: 'WFM Relay is an unofficial, community-built API explorer for UKG Workforce Management. Not affiliated with or endorsed by UKG.',
  ogTitle: 'About — WFM Relay',
  ogDescription: 'WFM Relay is an unofficial, community-built API explorer for UKG Workforce Management. Not affiliated with or endorsed by UKG.',
  twitterTitle: 'About — WFM Relay',
  twitterDescription: 'WFM Relay is an unofficial, community-built API explorer for UKG Workforce Management. Not affiliated with or endorsed by UKG.',
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        About WFM Relay
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        An unofficial API explorer for UKG Workforce Management.
      </p>
    </div>

    <!-- What is it -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">What is WFM Relay?</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <p>
          WFM Relay is a browser-based tool that lets you authenticate against a UKG Workforce
          Management environment and interactively explore its API endpoints — without writing
          a single line of code or configuring a REST client.
        </p>
        <p>
          Authenticate once, select an endpoint, execute the request, and inspect the results
          in a structured table or as raw JSON. It was built to save time for anyone who regularly
          works with WFM data: administrators, implementers, support engineers, and developers.
        </p>
      </CardContent>
    </Card>

    <!-- Disclaimer -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Disclaimer</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <p>
          WFM Relay is not affiliated with, endorsed by, or supported by UKG or any of its
          subsidiaries. It is an independent, community-built tool.
        </p>
        <p>
          This tool is provided as-is, with no warranty of any kind. It is not a substitute for
          official UKG documentation, support, or tooling. Use it at your own discretion and in
          accordance with your organization's policies regarding API access.
        </p>
        <p>
          All API endpoints, request formats, and response structures exposed by this application are sourced from UKG's publicly available developer documentation at <NuxtLink to="https://developer.ukg.com" target="_blank" class="text-primary hover:text-accent">developer.ukg.com</NuxtLink>. No proprietary or non-public information is used. WFM Relay does not interact with the WFM API in any way that is not already documented and intended by UKG — it simply provides a cleaner interface for sending documented requests and reading the responses.
        </p>
        <p>
          <strong class="font-medium">Credentials and tokens are never stored or logged by this application.</strong>
          Authentication tokens are held only in short-lived, HTTP-only session cookies in your
          browser and are discarded when you log out or close the session.
        </p>
      </CardContent>
    </Card>

    <!-- Who built it -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Who built this?</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <p>
          WFM Relay was built by members of the WFM community — people who work with the
          platform daily and wanted a faster, friendlier way to interact with its API.
        </p>
        <p>
          It is open source. Contributions, bug reports, and feature suggestions are welcome.
        </p>
      </CardContent>
    </Card>

    <!-- Feedback -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Report an issue or request a feature</CardTitle>
      </CardHeader>
      <CardContent class="text-sm">
        <p class="mb-4">
          Found a bug? Have an idea for a new endpoint or improvement? Open an issue on GitHub.
        </p>
        <a
          href="https://github.com/nconklindev/wfm-relay/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-primary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Open an issue on GitHub
          <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  </div>
</template>
