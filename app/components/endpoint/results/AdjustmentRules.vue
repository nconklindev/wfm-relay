<script setup lang="ts">
/**
 * Custom result display for the adjustment-rules endpoint.
 *
 * Renders an expandable list of adjustment rules with their effective-dated
 * versions, triggers, and allocation details. Handles the varied response
 * shapes returned by the WFM API.
 */

import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Types ───────────────────────────────────────────────────────────────────

interface AllocationEntry {
  adjustmentType?: string
  type?: string
  amount?: number
  bonusRateAmount?: number
  bonusRateHourlyRate?: number
  payCode?: { name?: string; qualifier?: string }
}

interface Trigger {
  jobOrLocation?: { qualifier?: string }
  jobOrLocationEffectiveDate?: string
  laborCategoryEntries?: string
  costCenter?: string
  payCodes?: { qualifier?: string }[]
  genericLocations?: unknown[]
  adjustmentAllocation?: {
    adjustmentAllocation?: AllocationEntry[]
  }
}

interface RuleVersion {
  versionId?: string | number
  description?: string
  effectiveDate?: string
  expirationDate?: string
  triggers?: {
    adjustmentTriggerForRule?: Trigger[]
  }
}

interface AdjustmentRule {
  id: string | number
  name: string
  ruleVersions?: {
    adjustmentRuleVersion?: RuleVersion[]
  }
}

// ── Data extraction ─────────────────────────────────────────────────────────

function extractRules(response: unknown): AdjustmentRule[] {
  if (Array.isArray(response)) return response as AdjustmentRule[]
  if (typeof response !== 'object' || response === null) return []

  const obj = response as Record<string, unknown>
  for (const key of ['data', 'adjustmentRules', 'items', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as AdjustmentRule[]
  }
  // Fallback: first array-valued key
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as AdjustmentRule[]
    }
  }
  return []
}

function getVersions(rule: AdjustmentRule): RuleVersion[] {
  return rule.ruleVersions?.adjustmentRuleVersion ?? []
}

function getTriggers(version: RuleVersion): Trigger[] {
  return version.triggers?.adjustmentTriggerForRule ?? []
}

function getAllocations(trigger: Trigger): AllocationEntry[] {
  return trigger.adjustmentAllocation?.adjustmentAllocation ?? []
}

function formatDate(date: string | undefined): string {
  if (!date) return '--'
  const year = parseInt(date.substring(0, 4), 10)
  if (year >= 3000) return 'No expiration'
  return date
}

function formatDateRange(effective: string | undefined, expiration: string | undefined): string {
  return `${formatDate(effective)} \u2192 ${formatDate(expiration)}`
}

function formatPayCodes(payCodes: { qualifier?: string }[] | undefined): string {
  if (!payCodes || payCodes.length === 0) return '--'
  return payCodes.map(pc => pc.qualifier ?? '--').join(', ')
}

// ── State ───────────────────────────────────────────────────────────────────

const search = ref('')
const expandedIds = ref<Set<string | number>>(new Set())

// ── Derived ─────────────────────────────────────────────────────────────────

const rules = computed(() => extractRules(props.response))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return rules.value
  return rules.value.filter(rule =>
    rule.name?.toLowerCase().includes(q),
  )
})

const totalCount = computed(() => filtered.value.length)

// ── Actions ─────────────────────────────────────────────────────────────────

function toggleExpanded(id: string | number) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) {
    next.delete(id)
  }
  else {
    next.add(id)
  }
  expandedIds.value = next
}

function isExpanded(id: string | number): boolean {
  return expandedIds.value.has(id)
}

function expandAll() {
  expandedIds.value = new Set(rules.value.map(r => r.id))
}

function collapseAll() {
  expandedIds.value = new Set()
}

const allExpanded = computed(
  () => rules.value.length > 0 && rules.value.every(r => expandedIds.value.has(r.id)),
)
</script>

<template>
  <div v-if="rules.length > 0" class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-muted-foreground">
          {{ totalCount.toLocaleString() }} rule{{ totalCount === 1 ? '' : 's' }}
          <template v-if="rules.length !== totalCount">
            (filtered from {{ rules.length.toLocaleString() }})
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
          placeholder="Search rules..."
          class="pl-8 h-9 text-sm"
          aria-label="Search adjustment rules"
        />
      </div>
    </div>

    <!-- Rule list -->
    <div class="rounded-md border divide-y">
      <div
        v-for="rule in filtered"
        :key="rule.id"
      >
        <!-- Rule header row -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 min-h-11 text-sm transition-colors hover:bg-muted/50"
          :aria-expanded="isExpanded(rule.id)"
          @click="toggleExpanded(rule.id)"
        >
          <component
            :is="isExpanded(rule.id) ? ChevronDown : ChevronRight"
            class="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="font-medium text-foreground text-left wrap-break-word min-w-0">{{ rule.name }}</span>
          <Badge variant="secondary" class="ml-auto shrink-0">
            {{ getVersions(rule).length }} version{{ getVersions(rule).length === 1 ? '' : 's' }}
          </Badge>
        </button>

        <!-- Expanded: version cards -->
        <div v-if="isExpanded(rule.id)" class="border-t bg-muted/20 px-3 py-4 space-y-4 sm:px-5">
          <div
            v-for="(version, vi) in getVersions(rule)"
            :key="version.versionId ?? vi"
            class="rounded-lg border bg-background p-4 space-y-4 sm:p-5"
          >
            <!-- Version header -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span class="text-sm font-medium text-foreground">
                Version {{ version.versionId ?? vi + 1 }}
              </span>
              <span class="text-xs sm:text-sm text-muted-foreground">
                {{ formatDateRange(version.effectiveDate, version.expirationDate) }}
              </span>
            </div>

            <!-- Description -->
            <p
              v-if="version.description"
              class="text-sm text-muted-foreground"
            >
              {{ version.description }}
            </p>

            <!-- Triggers -->
            <div
              v-for="(trigger, ti) in getTriggers(version)"
              :key="ti"
              class="rounded-md border bg-muted/30 p-3.5 space-y-3 sm:p-4"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trigger {{ getTriggers(version).length > 1 ? ti + 1 : '' }}
              </p>

              <!-- Trigger key-value pairs -->
              <dl class="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                <div class="flex gap-3">
                  <dt class="text-muted-foreground shrink-0">Job/Location:</dt>
                  <dd class="text-foreground wrap-break-word min-w-0">{{ trigger.jobOrLocation?.qualifier ?? '--' }}</dd>
                </div>
                <div class="flex gap-3">
                  <dt class="text-muted-foreground shrink-0">Labor Categories:</dt>
                  <dd class="text-foreground wrap-break-word min-w-0">{{ trigger.laborCategoryEntries ?? '--' }}</dd>
                </div>
                <div class="flex gap-3">
                  <dt class="text-muted-foreground shrink-0">Cost Center:</dt>
                  <dd class="text-foreground wrap-break-word min-w-0">{{ trigger.costCenter ?? '--' }}</dd>
                </div>
                <div class="flex gap-3">
                  <dt class="text-muted-foreground shrink-0">Pay Codes:</dt>
                  <dd class="text-foreground wrap-break-word min-w-0">{{ formatPayCodes(trigger.payCodes) }}</dd>
                </div>
              </dl>

              <!-- Allocations -->
              <div
                v-for="(alloc, ai) in getAllocations(trigger)"
                :key="ai"
                class="rounded border bg-background px-3.5 py-3 sm:px-4"
              >
                <p class="text-xs font-medium text-muted-foreground mb-2">
                  Allocation {{ getAllocations(trigger).length > 1 ? ai + 1 : '' }}
                </p>
                <dl class="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div class="flex gap-3">
                    <dt class="text-muted-foreground shrink-0">Type:</dt>
                    <dd class="text-foreground wrap-break-word min-w-0">{{ alloc.adjustmentType ?? alloc.type ?? '--' }}</dd>
                  </div>
                  <div class="flex gap-3">
                    <dt class="text-muted-foreground shrink-0">Pay Code:</dt>
                    <dd class="text-foreground wrap-break-word min-w-0">{{ alloc.payCode?.name ?? alloc.payCode?.qualifier ?? '--' }}</dd>
                  </div>
                  <div v-if="alloc.amount != null" class="flex gap-3">
                    <dt class="text-muted-foreground shrink-0">Amount:</dt>
                    <dd class="text-foreground">{{ alloc.amount }}</dd>
                  </div>
                  <div v-if="alloc.bonusRateAmount != null" class="flex gap-3">
                    <dt class="text-muted-foreground shrink-0">Bonus Rate:</dt>
                    <dd class="text-foreground">{{ alloc.bonusRateAmount }}</dd>
                  </div>
                  <div v-if="alloc.bonusRateHourlyRate != null" class="flex gap-3">
                    <dt class="text-muted-foreground shrink-0">Bonus Hourly:</dt>
                    <dd class="text-foreground">{{ alloc.bonusRateHourlyRate }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- No triggers fallback -->
            <p
              v-if="getTriggers(version).length === 0"
              class="text-xs text-muted-foreground italic"
            >
              No triggers configured for this version.
            </p>
          </div>

          <!-- No versions fallback -->
          <p
            v-if="getVersions(rule).length === 0"
            class="text-xs text-muted-foreground italic"
          >
            No versions found for this rule.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
