<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  KeyRound,
  LogIn,
  MousePointerClick,
  Table2,
  TriangleAlert,
} from 'lucide-vue-next'

useSeoMeta({
  title: 'User Guide',
  description: 'Step-by-step instructions for getting credentials and exploring WFM API endpoints with WFM Relay.',
  ogTitle: 'User Guide — WFM Relay',
  ogDescription: 'Step-by-step instructions for getting credentials and exploring WFM API endpoints with WFM Relay.',
  twitterTitle: 'User Guide — WFM Relay',
  twitterDescription: 'Step-by-step instructions for getting credentials and exploring WFM API endpoints with WFM Relay.',
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-8">

    <div>
      <h1 class="text-2xl font-semibold tracking-tight">User Guide</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Everything you need to start pulling data from your WFM environment.
      </p>
    </div>

    <!-- Step 1: What you'll need -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <KeyRound class="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          Step 1 — What you'll need
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 text-sm">
        <p>
          Before you can use WFM Relay, you need a set of API credentials for your WFM
          environment. These are separate from your regular WFM login. Admins can set up a new Client under <strong class="font-medium">Administration → Application Setup →
          Common Setup → Client Management</strong>.
        </p>

        <div class="space-y-3">
          <div class="rounded-md border bg-muted/30 p-3 space-y-1">
            <p class="font-medium">Environment URL (Hostname)</p>
            <p class="text-muted-foreground">
              The full URL of your WFM environment — the same address you type into your browser
              to log into WFM. For example: <code class="font-mono text-xs">https://yourcompany.mykronos.com</code>
            </p>
          </div>

          <div class="rounded-md border bg-muted/30 p-3 space-y-1">
            <p class="font-medium">Client ID</p>
            <p class="text-muted-foreground">
              A unique identifier for the API client configured in WFM. Found in the OAuth client
              details in Developer Tools.
            </p>
          </div>

          <div class="rounded-md border bg-muted/30 p-3 space-y-1">
            <p class="font-medium">Client Secret</p>
            <p class="text-muted-foreground">
              The password for the API client. Treat this like a password — do not share it.
              It is only shown once when the OAuth client is created.
            </p>
          </div>

          <div class="rounded-md border bg-muted/30 p-3 space-y-1">
            <p class="font-medium">Org Realm ID</p>
            <p class="text-muted-foreground">
              The identifier for your WFM tenant. This is typically visible in the OAuth client
              configuration or can be obtained from your WFM administrator.
            </p>
          </div>

          <div class="rounded-md border bg-muted/30 p-3 space-y-1">
            <p class="font-medium">Username &amp; Password <span class="font-normal text-muted-foreground">(Interactive flow only)</span></p>
            <p class="text-muted-foreground">
              Your personal WFM login credentials. Only required if you choose the
              Interactive authentication flow (see Step 2).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Step 2: Auth flow -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <LogIn class="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          Step 2 — Choose an authentication flow
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 text-sm">
        <p>
          WFM Relay supports two ways of authenticating. Which one you use depends on how your
          WFM environment is configured and what data you need to access.
        </p>

        <div class="space-y-3">
          <div class="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p class="font-medium">Interactive <span class="text-muted-foreground font-normal">(recommended for most users)</span></p>
            <p class="text-muted-foreground">
              You log in with your own WFM username and password alongside your API credentials.
              The data you can retrieve is scoped to whatever your WFM account has permission to
              see — just like logging in normally.
            </p>
            <p class="text-muted-foreground">
              <strong class="font-medium text-foreground">Use this if</strong> you want to see
              data through your own access level, or if you are unsure which flow to use.
            </p>
          </div>

          <div class="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p class="font-medium">Non-Interactive <span class="text-muted-foreground font-normal">(service account)</span></p>
            <p class="text-muted-foreground">
              Authenticates using only the API client credentials, without a personal username and
              password. This requires a dedicated API service account to be configured in WFM with
              the appropriate access control points granted.
            </p>
            <p class="text-muted-foreground">
              <strong class="font-medium text-foreground">Use this if</strong> your administrator
              has set up a service account specifically for API access, or if you need to retrieve
              data beyond your personal access level.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Step 3: Authenticating -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <MousePointerClick class="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          Step 3 — Authenticate
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <ol class="space-y-3 list-none">
          <li class="flex gap-3">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
            <span>On the home page, select either <strong class="font-medium">Interactive</strong> or <strong class="font-medium">Non-Interactive</strong> under "Authentication Flow".</span>
          </li>
          <li class="flex gap-3">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">2</span>
            <span>Fill in your credentials. All fields are required. Your Environment URL should include <code class="font-mono text-xs">https://</code>.</span>
          </li>
          <li class="flex gap-3">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">3</span>
            <span>Click <strong class="font-medium">Authenticate</strong>. If your credentials are correct, the form will be replaced with a confirmation showing your environment URL and a <strong class="font-medium">Log Out</strong> button.</span>
          </li>
          <li class="flex gap-3">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">4</span>
            <span>You are now ready to query endpoints. Your session is stored securely in your browser and will expire after 8 hours.</span>
          </li>
        </ol>
      </CardContent>
    </Card>

    <!-- Step 4: Running a query -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <Table2 class="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          Step 4 — Run a query and read the results
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4 text-sm">
        <div class="space-y-2">
          <p class="font-medium">Selecting an endpoint</p>
          <p class="text-muted-foreground">
            Use the dropdown to pick an API endpoint. Endpoints are grouped by category
            (Common Resources, People, Labor Categories, Timekeeping, Platform). If you are
            unsure which one to use, the description shown after selecting will explain what
            it retrieves.
          </p>
        </div>

        <div class="space-y-2">
          <p class="font-medium">Filling in inputs</p>
          <p class="text-muted-foreground">
            Some endpoints have optional input fields — for example, Locations lets you filter
            by a Business Structure node. These are always optional unless marked required.
            Most endpoints need no input at all — just click <strong class="font-medium">Execute Request</strong>.
          </p>
        </div>

        <div class="space-y-2">
          <p class="font-medium">The results table</p>
          <p class="text-muted-foreground">
            Results appear as a table below the endpoint panel. You can:
          </p>
          <ul class="ml-4 space-y-1 list-disc text-muted-foreground">
            <li>Click any column header to sort by that column</li>
            <li>Use the search box to filter rows by any value</li>
            <li>Navigate pages using the Previous / Next buttons</li>
            <li>Hover over a cell to see its full value in a tooltip</li>
          </ul>
        </div>

        <div class="space-y-2">
          <p class="font-medium">Raw JSON</p>
          <p class="text-muted-foreground">
            Below the table, a collapsible <strong class="font-medium">Raw JSON</strong> section
            shows the complete, unformatted response exactly as it was returned by WFM. Use this
            if you need data that is not visible in the table, or if you want to copy the response
            for use elsewhere. Click <strong class="font-medium">Copy</strong> to copy the full
            JSON to your clipboard.
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Troubleshooting -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-base">
          <TriangleAlert class="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          Troubleshooting
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3 text-sm">
        <div class="space-y-2">
          <p class="font-medium">"Authentication failed" or "invalid credentials"</p>
          <p class="text-muted-foreground">
            Double-check that your Client ID, Client Secret, and Org Realm ID are correct and
            belong to the same OAuth client. Make sure the Environment URL includes
            <code class="font-mono text-xs">https://</code> and has no trailing slash.
          </p>
        </div>

        <div class="space-y-2">
          <p class="font-medium">A request returns an access error</p>
          <p class="text-muted-foreground">
            Your account (or service account) may not have the required access control point
            granted in WFM. Each endpoint's documentation panel lists the relevant access
            control point. Contact your WFM administrator to have it granted.
          </p>
        </div>

        <div class="space-y-2">
          <p class="font-medium">The table shows no data</p>
          <p class="text-muted-foreground">
            The request may have succeeded but returned an empty result set — meaning there
            is no data of that type configured in your environment. Check the Raw JSON section
            to see the full response.
          </p>
        </div>

        <div class="space-y-2">
          <p class="font-medium">Something else isn't working</p>
          <p class="text-muted-foreground">
            Open an issue on
            <a
              href="https://github.com/nconklindev/wfm-relay/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:text-accent transition-colors underline underline-offset-2"
            >GitHub</a>
            and describe what happened.
          </p>
        </div>
      </CardContent>
    </Card>

  </div>
</template>
