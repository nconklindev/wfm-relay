<script setup lang="ts">
import type { Component } from 'vue'
import type { WfmEndpointDef, WfmEndpointId } from '@/composables/useWfm'
import { CircleAlert, Check, Clipboard, Play } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import LaborCategorySelect from './inputs/LaborCategorySelect.vue'
import AdjustmentRulesResult from './results/AdjustmentRules.vue'
import PayRulesResult from './results/PayRules.vue'

const props = defineProps<{
  endpoint: WfmEndpointDef
  isAuthenticated: boolean
}>()

/**
 * Registry of custom input components for endpoints that need more than simple
 * text/date fields. To support a new complex endpoint, add its ID here and
 * create a component in ./inputs/ that emits `update:modelValue` with the
 * request body.
 */
const CUSTOM_INPUT_REGISTRY: Partial<Record<WfmEndpointId, Component>> = {
  'labor-category-entries-paginated': LaborCategorySelect,
}

/**
 * Registry of custom result display components for endpoints whose response
 * structure is too complex for the generic ApiDataTable. To support a new
 * endpoint, add its ID here and create a component in ./results/ that accepts
 * a `response: unknown` prop.
 */
const CUSTOM_RESULT_REGISTRY: Partial<Record<WfmEndpointId, Component>> = {
  'adjustment-rules': AdjustmentRulesResult,
  'pay-rules': PayRulesResult,
}

const { call } = useWfm()
const { addEntry } = useRequestHistory()

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract a record count from the response using the same candidate keys
 * as ApiDataTable's `extractRows`. Returns `null` when the count cannot be
 * determined.
 */
function countResults(res: unknown): number | null {
  if (Array.isArray(res)) return res.length
  if (typeof res !== 'object' || res === null) return null

  const obj = res as Record<string, unknown>
  const candidates = ['data', 'items', 'coreProperties', 'results', 'records', 'employees', 'locations']
  for (const key of candidates) {
    if (Array.isArray(obj[key])) return (obj[key] as unknown[]).length
  }
  // Fallback: first array-valued key containing objects
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      return val.length
    }
  }
  return null
}

// ── State ──────────────────────────────────────────────────────────────────

/** Values for declarative `inputs` fields. */
const formData = ref<Record<string, string>>({})
/** Data emitted from a custom input component. */
const customData = ref<Record<string, unknown>>({})

const isLoading = ref(false)
const response = ref<unknown>(null)
const error = ref('')
const rawJsonExpanded = ref(false)
const { copy, copied } = useClipboard()

// ── Derived ────────────────────────────────────────────────────────────────

const customInputComponent = computed<Component | undefined>(
  () => CUSTOM_INPUT_REGISTRY[props.endpoint.id as WfmEndpointId],
)
const hasCustomInput = computed(() => !!customInputComponent.value)

const customResultComponent = computed<Component | undefined>(
  () => CUSTOM_RESULT_REGISTRY[props.endpoint.id as WfmEndpointId],
)
const hasCustomResult = computed(() => !!customResultComponent.value)

const methodClass = computed(() =>
  props.endpoint.method === 'GET'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
)

const hasResponse = computed(() => response.value !== null)
const rawJson = computed(() =>
  hasResponse.value ? JSON.stringify(response.value, null, 2) : '',
)

// Reset state when endpoint changes
watch(() => props.endpoint.id, () => {
  formData.value = {}
  customData.value = {}
  response.value = null
  error.value = ''
  rawJsonExpanded.value = false
})

// ── Actions ────────────────────────────────────────────────────────────────

async function executeRequest() {
  if (!props.isAuthenticated) return
  isLoading.value = true
  error.value = ''
  response.value = null
  try {
    let body: unknown
    if (hasCustomInput.value) {
      body = Object.keys(customData.value).length ? customData.value : undefined
    }
    else {
      body = (props.endpoint.buildBody?.(formData.value) ?? buildGenericBody()) ?? props.endpoint.defaultBody
    }
    response.value = await call(props.endpoint.id as WfmEndpointId, body)

    const { id, label, method, path } = props.endpoint
    addEntry({
      endpointId: id,
      endpointLabel: label,
      method,
      path,
      resultCount: countResults(response.value),
    })
  }
  catch (err) {
    // Error chain: Nitro wraps the upstream error as { statusMessage, data: <wfm body> }.
    // The WFM message is promoted to statusMessage on the server, but we also check
    // data.statusMessage and data.data.message as fallbacks for any unexpected shapes.
    const e = err as {
      data?: {
        statusMessage?: string
        message?: string
        data?: { message?: string; detail?: string }
      }
      statusMessage?: string
    }
    error.value = e.data?.statusMessage
      ?? e.data?.data?.message
      ?? e.data?.data?.detail
      ?? e.data?.message
      ?? e.statusMessage
      ?? 'Request failed. Check the raw JSON for details.'
  }
  finally {
    isLoading.value = false
  }
}

function buildGenericBody(): Record<string, string> | undefined {
  const filled = Object.fromEntries(
    Object.entries(formData.value).filter(([, v]) => v !== '' && v !== undefined),
  )
  return Object.keys(filled).length ? filled : undefined
}
</script>

<template>
  <div class="space-y-6">
    <!-- Endpoint header -->
    <div class="flex flex-wrap items-center gap-2 sm:gap-3">
      <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold shrink-0"
        :class="[methodClass]" :aria-label="`HTTP method: ${endpoint.method}`">
        {{ endpoint.method }}
      </span>
      <code class="text-xs sm:text-sm font-mono text-muted-foreground break-all min-w-0">{{ endpoint.path }}</code>
    </div>

    <!-- Two-column layout: inputs left, docs right -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Left: inputs + execute -->
      <section class="space-y-4">
        <!-- Custom input component -->
        <component :is="customInputComponent" v-if="hasCustomInput" :is-authenticated="isAuthenticated"
          @update:model-value="customData = $event" />

        <!-- Generic declarative inputs -->
        <template v-else-if="endpoint.inputs?.length">
          <div v-for="input in endpoint.inputs" :key="input.name" class="space-y-1.5">
            <Label :for="`input-${input.name}`">{{ input.label }}</Label>
            <p v-if="input.description" class="text-xs text-muted-foreground">
              {{ input.description }}
            </p>
            <Input :id="`input-${input.name}`" v-model="formData[input.name]" :type="input.type"
              :placeholder="input.placeholder" :required="input.required" :disabled="!isAuthenticated" />
          </div>
        </template>

        <!-- Execute button -->
        <div class="space-y-2">
          <Button class="w-full sm:w-auto" :disabled="!isAuthenticated || isLoading" @click="executeRequest">
            <Play v-if="!isLoading" class="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            {{ isLoading ? 'Loading…' : 'Execute Request' }}
          </Button>
          <p v-if="!isAuthenticated" class="text-sm text-amber-600 dark:text-amber-400">
            Please authenticate to execute this request.
          </p>
        </div>
      </section>

      <!-- Right: documentation -->
      <div class="space-y-3">
        <h3 class="text-sm font-semibold">Endpoint Information</h3>
        <div class="rounded-lg border bg-muted/30 p-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            About this endpoint
          </p>
          <ul class="space-y-1 text-sm">
            <li v-for="(note, i) in endpoint.notes" :key="i" class="flex gap-2">
              <span class="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true">·</span>
              {{ note }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error"
      class="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert">
      <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {{ error }}
    </div>

    <!-- Results -->
    <template v-if="hasResponse">
      <!-- Result display: custom component if registered, otherwise generic table -->
      <component :is="customResultComponent" v-if="hasCustomResult" :response="response" />
      <EndpointApiDataTable v-else :response="response" />

      <!-- Raw JSON (collapsible) -->
      <div class="rounded-md border">
        <div class="flex items-center">
          <button type="button"
            class="flex flex-1 items-center justify-between px-4 py-3 min-h-11 text-sm font-medium transition-colors hover:bg-muted/50"
            :aria-expanded="rawJsonExpanded" @click="rawJsonExpanded = !rawJsonExpanded">
            Raw JSON
            <span class="text-xs text-muted-foreground">{{ rawJsonExpanded ? 'Hide' : 'Show' }}</span>
          </button>
          <button type="button"
            class="flex items-center gap-1.5 border-l px-3 py-3 min-h-11 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            :aria-label="copied ? 'Copied!' : 'Copy JSON to clipboard'" @click="copy(rawJson)">
            <Check v-if="copied" class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <Clipboard v-else class="h-3.5 w-3.5" aria-hidden="true" />
            <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
          </button>
        </div>
        <div v-if="rawJsonExpanded" class="border-t">
          <pre class="max-h-125 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground">{{ rawJson }}</pre>
        </div>
      </div>
    </template>
  </div>
</template>
