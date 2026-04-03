<script setup lang="ts">
/**
 * Custom result display for the paycode-distributions endpoint.
 *
 * Each distribution has a combination rule and a list of distribution
 * assignments. Each assignment maps a deviation to sets of overtimes,
 * paycode assignments, external processors, and zones — all rendered
 * as inline qualifier lists in a key-value grid.
 */

import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Types ───────────────────────────────────────────────────────────────────

interface Ref {
  id?: number
  qualifier?: string
}

interface DistributionAssignment {
  deviation?: Ref
  overtimes?: Ref[]
  paycodeAssignments?: Ref[]
  extProcessors?: Ref[]
  zones?: Ref[]
}

interface PaycodeDistribution {
  id?: number
  name?: string
  combinationRule?: Ref
  distributionAssignments?: DistributionAssignment[]
}

// ── Data extraction ─────────────────────────────────────────────────────────

function extractDistributions(response: unknown): PaycodeDistribution[] {
  if (Array.isArray(response)) return response as PaycodeDistribution[]
  if (typeof response !== 'object' || response === null) return []

  const obj = response as Record<string, unknown>
  for (const key of ['data', 'paycodeDistributions', 'distributions', 'items', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as PaycodeDistribution[]
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as PaycodeDistribution[]
    }
  }
  return []
}

function formatRef(ref: Ref | undefined): string {
  if (!ref) return '--'
  return ref.qualifier ?? String(ref.id ?? '--')
}

function formatRefList(refs: Ref[] | undefined): string {
  if (!refs || refs.length === 0) return '--'
  return refs.map(r => r.qualifier ?? String(r.id ?? '?')).join(', ')
}

function distKey(dist: PaycodeDistribution): number | string {
  return dist.id ?? dist.name ?? ''
}

// ── State ───────────────────────────────────────────────────────────────────

const search = ref('')
const expandedIds = ref<Set<number | string>>(new Set())

// ── Derived ─────────────────────────────────────────────────────────────────

const distributions = computed(() => extractDistributions(props.response))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return distributions.value
  return distributions.value.filter(d => d.name?.toLowerCase().includes(q))
})

const totalCount = computed(() => filtered.value.length)

const allExpanded = computed(
  () => distributions.value.length > 0 && distributions.value.every(d => expandedIds.value.has(distKey(d))),
)

// ── Actions ─────────────────────────────────────────────────────────────────

function toggle(key: number | string) {
  const next = new Set(expandedIds.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedIds.value = next
}

function isExpanded(key: number | string): boolean {
  return expandedIds.value.has(key)
}

function expandAll() {
  expandedIds.value = new Set(distributions.value.map(distKey))
}

function collapseAll() {
  expandedIds.value = new Set()
}
</script>

<template>
  <div v-if="distributions.length > 0" class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-muted-foreground">
          {{ totalCount.toLocaleString() }} distribution{{ totalCount === 1 ? '' : 's' }}
          <template v-if="distributions.length !== totalCount">
            (filtered from {{ distributions.length.toLocaleString() }})
          </template>
        </p>
        <div class="flex items-center gap-1 text-xs">
          <button
            type="button"
            class="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="allExpanded"
            @click="expandAll"
          >
            Expand all
          </button>
          <span class="text-border">·</span>
          <button
            type="button"
            class="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="expandedIds.size === 0"
            @click="collapseAll"
          >
            Collapse all
          </button>
        </div>
      </div>
      <div class="relative w-full sm:w-64">
        <Search
          class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          v-model="search"
          placeholder="Search distributions..."
          class="pl-8 h-9 text-sm"
          aria-label="Search paycode distributions"
        />
      </div>
    </div>

    <!-- Distribution list -->
    <div class="rounded-md border divide-y">
      <div v-for="dist in filtered" :key="distKey(dist)">
        <!-- Header row -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 min-h-11 text-sm transition-colors hover:bg-muted/50"
          :aria-expanded="isExpanded(distKey(dist))"
          @click="toggle(distKey(dist))"
        >
          <component
            :is="isExpanded(distKey(dist)) ? ChevronDown : ChevronRight"
            class="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="font-medium text-foreground text-left wrap-break-word min-w-0">{{ dist.name ?? '--' }}</span>
          <Badge
            v-if="(dist.distributionAssignments?.length ?? 0) > 0"
            variant="secondary"
            class="ml-auto shrink-0"
          >
            {{ dist.distributionAssignments!.length }} assignment{{ dist.distributionAssignments!.length === 1 ? '' : 's' }}
          </Badge>
        </button>

        <!-- Expanded -->
        <div v-if="isExpanded(distKey(dist))" class="border-t bg-muted/20 px-3 py-4 space-y-4 sm:px-5">

          <!-- Combination rule -->
          <div v-if="dist.combinationRule" class="flex items-baseline gap-2 text-sm">
            <dt class="text-muted-foreground shrink-0">Combination Rule</dt>
            <dd class="text-foreground">{{ formatRef(dist.combinationRule) }}</dd>
          </div>

          <!-- Distribution assignments -->
          <div
            v-for="(assignment, ai) in dist.distributionAssignments"
            :key="ai"
            class="rounded-lg border bg-background p-4 space-y-3 sm:p-5"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assignment{{ (dist.distributionAssignments?.length ?? 0) > 1 ? ` ${ai + 1}` : '' }}
            </p>
            <dl class="grid grid-cols-1 gap-y-2 gap-x-6 text-sm sm:grid-cols-2">
              <div class="flex gap-2 sm:col-span-2">
                <dt class="text-muted-foreground shrink-0 min-w-36">Deviation</dt>
                <dd class="text-foreground wrap-break-word min-w-0">{{ formatRef(assignment.deviation) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-muted-foreground shrink-0 min-w-36">Overtime Rules</dt>
                <dd class="text-foreground wrap-break-word min-w-0">{{ formatRefList(assignment.overtimes) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-muted-foreground shrink-0 min-w-36">Paycode Assignments</dt>
                <dd class="text-foreground wrap-break-word min-w-0">{{ formatRefList(assignment.paycodeAssignments) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-muted-foreground shrink-0 min-w-36">Ext Processors</dt>
                <dd class="text-foreground wrap-break-word min-w-0">{{ formatRefList(assignment.extProcessors) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-muted-foreground shrink-0 min-w-36">Zones</dt>
                <dd class="text-foreground wrap-break-word min-w-0">{{ formatRefList(assignment.zones) }}</dd>
              </div>
            </dl>
          </div>

          <p v-if="(dist.distributionAssignments?.length ?? 0) === 0" class="text-xs text-muted-foreground italic">
            No distribution assignments defined.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
