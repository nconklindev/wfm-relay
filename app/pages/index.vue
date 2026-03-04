<script setup lang="ts">
import type { WfmEndpointDef, WfmEndpointId, WfmFlow } from '@/composables/useWfm'
import { Eye, EyeOff } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Field, FieldLabel, FieldError, FieldSet, FieldLegend } from '@/components/ui/field'
import Select from '~/components/ui/select/Select.vue'
import { SelectGroup, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel } from '~/components/ui/select'

useSeoMeta({
  title: 'API Explorer',
  description: 'Authenticate against your UKG WFM environment and interactively explore API endpoints — no code required.',
  ogTitle: 'API Explorer — WFM Relay',
  ogDescription: 'Authenticate against your UKG WFM environment and interactively explore API endpoints — no code required.',
  twitterTitle: 'API Explorer — WFM Relay',
  twitterDescription: 'Authenticate against your UKG WFM environment and interactively explore API endpoints — no code required.',
})

const { endpoints, authenticate: wfmAuthenticate, logout: wfmLogout } = useWfm()

// ---- State ----
const flowType = ref<WfmFlow | null>(null)
const isAuthenticated = ref(false)
const isAuthenticating = ref(false)
const authError = ref('')

const clientId = ref('')
const clientSecret = ref('')
const orgRealmId = ref('')
const username = ref('')
const password = ref('')
const hostname = ref('')

const showClientSecret = ref(false)
const showPassword = ref(false)
const selectedEndpointId = ref<WfmEndpointId | ''>('')

// ---- Computed ----
const isInteractiveFlow = computed(() => flowType.value === 'interactive')
const orgRealmLabel = computed(() => flowType.value === 'interactive' ? 'Organization ID' : 'Realm ID')

const hostnameError = computed(() => {
  if (!hostname.value) return null
  if (!hostname.value.startsWith('https://')) return 'Must start with https://'
  if (hostname.value.endsWith('/')) return 'Remove the trailing slash'
  return null
})

const canAuthenticate = computed(() => {
  if (!flowType.value || !clientId.value || !clientSecret.value || !orgRealmId.value || !hostname.value) return false
  if (isInteractiveFlow.value && (!username.value || !password.value)) return false
  return true
})

// ---- Endpoint definitions (derived from composable) ----
const endpointCategories = computed(() => {
  const map = new Map<string, WfmEndpointDef[]>()
  for (const ep of endpoints) {
    if (!map.has(ep.category)) map.set(ep.category, [])
    map.get(ep.category)!.push(ep)
  }
  return [...map.entries()].map(([label, endpoints]) => ({ label, endpoints }))
})

const selectedEndpoint = computed(() => endpoints.find(e => e.id === selectedEndpointId.value) ?? null)

// ---- Methods ----
function handleFlowChange(type: WfmFlow) {
  if (flowType.value && flowType.value !== type) {
    clientId.value = ''
    clientSecret.value = ''
    orgRealmId.value = ''
    username.value = ''
    password.value = ''
    hostname.value = ''
    isAuthenticated.value = false
    authError.value = ''
  }
  flowType.value = type
}

async function authenticate() {
  if (!canAuthenticate.value) return
  isAuthenticating.value = true
  authError.value = ''
  try {
    await wfmAuthenticate({
      flow: flowType.value!,
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      orgRealmId: orgRealmId.value,
      hostname: hostname.value,
      username: username.value || undefined,
      password: password.value || undefined,
    })
    isAuthenticated.value = true
  }
  catch (error) {
    const err = error as { data?: { message?: string }; statusMessage?: string }
    authError.value = err.data?.message ?? err.statusMessage ?? 'Authentication failed. Please check your credentials and try again.'
  }
  finally {
    isAuthenticating.value = false
  }
}

async function logout() {
  await wfmLogout()
  isAuthenticated.value = false
  selectedEndpointId.value = ''
}

</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">WFM API Explorer</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Select an authentication flow, enter your credentials, then explore available API endpoints.
      </p>
    </div>

    <!-- Step 1: Flow selection -->
    <Card>
      <CardHeader>
        <CardTitle>Authentication Flow</CardTitle>
        <CardDescription>Choose how you want to authenticate with the WFM API.</CardDescription>
      </CardHeader>
      <CardContent>

        <FieldSet>
          <FieldLegend class="sr-only">Authentication flow type</FieldLegend>
          <div class="grid gap-3 sm:grid-cols-2">
            <label
              :class="[
                'relative flex cursor-pointer rounded-lg border p-4 transition-colors',
                flowType === 'interactive'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50',
              ]"
            >
              <input
                type="radio"
                name="flow-type"
                value="interactive"
                class="sr-only"
                :checked="flowType === 'interactive'"
                aria-describedby="interactive-flow-desc"
                @change="handleFlowChange('interactive')"
              >
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">Interactive Flow</span>
                <span id="interactive-flow-desc" class="text-xs text-muted-foreground">
                  User-based authentication with username and password.
                </span>
              </div>
              <div
                :class="[
                  'ml-auto mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                  flowType === 'interactive' ? 'border-primary bg-primary' : 'border-muted-foreground',
                ]"
                aria-hidden="true"
              />
            </label>

            <label
              :class="[
                'relative flex cursor-pointer rounded-lg border p-4 transition-colors',
                flowType === 'non-interactive'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50',
              ]"
            >
              <input
                type="radio"
                name="flow-type"
                value="non-interactive"
                class="sr-only"
                :checked="flowType === 'non-interactive'"
                aria-describedby="non-interactive-flow-desc"
                @change="handleFlowChange('non-interactive')"
              >
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">Non-Interactive Flow</span>
                <span id="non-interactive-flow-desc" class="text-xs text-muted-foreground">
                  Service account authentication using a client credentials grant.
                </span>
              </div>
              <div
                :class="[
                  'ml-auto mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                  flowType === 'non-interactive' ? 'border-primary bg-primary' : 'border-muted-foreground',
                ]"
                aria-hidden="true"
              />
            </label>
          </div>
        </FieldSet>
      </CardContent>
    </Card>

    <!-- Step 2: Configuration (appears after flow selection) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <Card v-if="flowType">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Enter your credentials for the
            {{ flowType === 'interactive' ? 'Interactive' : 'Non-Interactive' }} flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-6" @submit.prevent="authenticate">
            <!-- Client configuration -->
            <FieldSet class="space-y-4">
              <FieldLegend class="text-sm font-medium">Client Configuration</FieldLegend>
              <div class="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel for="client-id">Client ID</FieldLabel>
                  <Input
                    id="client-id"
                    v-model="clientId"
                    placeholder="Enter Client ID"
                    autocomplete="off"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel for="client-secret">Client Secret</FieldLabel>
                  <div class="relative">
                    <Input
                      id="client-secret"
                      v-model="clientSecret"
                      :type="showClientSecret ? 'text' : 'password'"
                      placeholder="Enter Client Secret"
                      autocomplete="off"
                      class="pr-10"
                      required
                    />
                    <button
                      type="button"
                      class="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      :aria-label="showClientSecret ? 'Hide client secret' : 'Show client secret'"
                      @click="showClientSecret = !showClientSecret"
                    >
                      <component :is="showClientSecret ? EyeOff : Eye" class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </Field>

                <Field class="sm:col-span-2">
                  <FieldLabel for="org-realm-id">{{ orgRealmLabel }}</FieldLabel>
                  <Input
                    id="org-realm-id"
                    v-model="orgRealmId"
                    :placeholder="`Enter ${orgRealmLabel}`"
                    autocomplete="off"
                    required
                  />
                </Field>
              </div>
            </FieldSet>

            <Separator />

            <!-- WFM configuration -->
            <FieldSet class="space-y-4">
              <FieldLegend class="text-sm font-medium">WFM Configuration</FieldLegend>

              <div v-if="isInteractiveFlow" class="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel for="wfm-username">Username</FieldLabel>
                  <Input
                    id="wfm-username"
                    v-model="username"
                    placeholder="Enter Username"
                    autocomplete="off"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel for="wfm-password">Password</FieldLabel>
                  <div class="relative">
                    <Input
                      id="wfm-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Enter Password"
                      autocomplete="off"
                      class="pr-10"
                      required
                    />
                    <button
                      type="button"
                      class="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-11 min-w-11 inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      @click="showPassword = !showPassword"
                    >
                      <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </Field>
              </div>

              <Field :data-invalid="!!hostnameError || undefined">
                <FieldLabel for="hostname">Hostname</FieldLabel>
                <Input
                  id="hostname"
                  v-model="hostname"
                  type="url"
                  placeholder="https://your-tenant.example.com"
                  autocomplete="off"
                  required
                />
                <FieldError v-if="hostnameError">{{ hostnameError }}</FieldError>
              </Field>
            </FieldSet>

            <Separator />

            <!-- Auth status and actions -->
            <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
              <div class="flex flex-wrap items-center gap-2.5" aria-live="polite" aria-atomic="true">
                <span class="text-sm text-muted-foreground">Status:</span>
                <Badge :variant="isAuthenticated ? 'default' : 'secondary'">
                  {{ isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}
                </Badge>
                <span v-if="isAuthenticated" class="w-full truncate text-xs text-muted-foreground sm:w-auto sm:max-w-xs">
                  {{ hostname }}
                </span>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  v-if="isAuthenticated"
                  type="button"
                  variant="outline"
                  size="sm"
                  class="w-full sm:w-auto"
                  @click="logout"
                >
                  Logout
                </Button>
                <Button type="submit" class="w-full sm:w-auto" :disabled="!canAuthenticate || isAuthenticating">
                  {{ isAuthenticated ? 'Re-authenticate' : isAuthenticating ? 'Authenticating…' : 'Authenticate' }}
                </Button>
              </div>
            </div>

            <p v-if="authError" role="alert" class="text-sm text-destructive">
              {{ authError }}
            </p>
          </form>
        </CardContent>
      </Card>
    </Transition>

    <!-- Guide callout (flow selected but not yet authenticated) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="flowType && !isAuthenticated"
        class="rounded-lg border border-muted bg-muted/30 px-4 py-3"
        role="note"
      >
        <p class="text-sm text-muted-foreground">
          Complete your credentials above and click <strong class="text-foreground font-medium">Authenticate</strong> to begin exploring endpoints.
        </p>
      </div>
    </Transition>

    <!-- Step 3: API Explorer (appears after authentication) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <Card v-if="isAuthenticated">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Select an endpoint to inspect and test.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2 w-full">
            <Label for="endpoint-select">Endpoint</Label>
            <Select
              id="endpoint-select"
              v-model="selectedEndpointId"
              aria-label="Select an API endpoint"
            >
              <SelectTrigger class="min-w-1/2">
                <SelectValue placeholder="Select an endpoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup v-for="category in endpointCategories" :key="category.label" :label="category.label">
                  <component :is="SelectLabel">{{ category.label }}</component>
                  <component :is="SelectItem" v-for="endpoint in category.endpoints" :key="endpoint.id" :value="endpoint.id">
                    [{{ endpoint.method }}] {{ endpoint.path }}
                  </component>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Endpoint detail / results area -->
          <section aria-label="Endpoint details">
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              mode="out-in"
            >
              <div v-if="selectedEndpoint" :key="selectedEndpoint.id" class="rounded-lg border p-3 sm:p-4">
                <EndpointPanel :endpoint="selectedEndpoint" :is-authenticated="isAuthenticated" />
              </div>

              <div
                v-else
                key="empty"
                class="flex min-h-32 items-center justify-center rounded-lg border border-dashed"
                aria-live="polite"
              >
                <p class="text-sm text-muted-foreground">Select an endpoint above to get started.</p>
              </div>
            </Transition>
          </section>
        </CardContent>
      </Card>
    </Transition>
  </div>
</template>
