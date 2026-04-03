<script setup lang="ts">
/**
 * Custom result display for the combination-rules endpoint.
 *
 * Each rule defines which rule components combine, what they pay out as,
 * and how they count toward overtime. The three sections — Selected Components,
 * Combinations, and OT Counting Rules — are rendered as inline tables inside
 * an expandable row per rule.
 */

import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Types ───────────────────────────────────────────────────────────────────

interface CombinationPair {
  type?: string
  name?: string
}

interface Combination {
  combinationPair?: CombinationPair[]
  getsPaidAs?: string
}

interface SelectedRule {
  componentType?: string
  description?: string
  name?: string
  continueToCountTO?: boolean
}

interface OTCountingRule {
  targetOTRuleComponentType?: string
  countsTowardTargetOT?: boolean
  sourceRuleComponentType?: string
  sourceRuleName?: { id?: number; qualifier?: string }
  targetOTRuleName?: string
}

interface CombinationRule {
  id: number | string
  name: string
  combinations?: Combination[]
  selectedComponents?: { selectedRules?: SelectedRule[] }
  combinationsTowardOT?: { combinationRulesCountTowardsOT?: OTCountingRule[] }
}

// ── Data extraction ─────────────────────────────────────────────────────────

function extractRules(response: unknown): CombinationRule[] {
  if (Array.isArray(response)) return response as CombinationRule[]
  if (typeof response !== 'object' || response === null) return []

  const obj = response as Record<string, unknown>
  for (const key of ['data', 'combinationRules', 'items', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as CombinationRule[]
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as CombinationRule[]
    }
  }
  return []
}

function getCombinations(rule: CombinationRule): Combination[] {
  return rule.combinations ?? []
}

function getSelectedRules(rule: CombinationRule): SelectedRule[] {
  return rule.selectedComponents?.selectedRules ?? []
}

function getOTRules(rule: CombinationRule): OTCountingRule[] {
  return rule.combinationsTowardOT?.combinationRulesCountTowardsOT ?? []
}

function formatPair(pair: CombinationPair): string {
  return pair.name ?? pair.type ?? '--'
}

// ── State ───────────────────────────────────────────────────────────────────

const search = ref('')
const expandedIds = ref<Set<number | string>>(new Set())

// ── Derived ─────────────────────────────────────────────────────────────────

const rules = computed(() => extractRules(props.response))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return rules.value
  return rules.value.filter(rule => rule.name?.toLowerCase().includes(q))
})

const totalCount = computed(() => filtered.value.length)

// ── Actions ─────────────────────────────────────────────────────────────────

function toggle(id: number | string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function isExpanded(id: number | string): boolean {
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
          aria-label="Search combination rules"
        />
      </div>
    </div>

    <!-- Rule list -->
    <div class="rounded-md border divide-y">
      <div v-for="rule in filtered" :key="rule.id">
        <!-- Header row -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 min-h-11 text-sm transition-colors hover:bg-muted/50"
          :aria-expanded="isExpanded(rule.id)"
          @click="toggle(rule.id)"
        >
          <component
            :is="isExpanded(rule.id) ? ChevronDown : ChevronRight"
            class="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="font-medium text-foreground text-left wrap-break-word min-w-0">{{ rule.name }}</span>
        </button>

        <!-- Expanded detail -->
        <div v-if="isExpanded(rule.id)" class="border-t bg-muted/20 px-4 py-4 space-y-5 sm:px-5">

          <!-- Selected Components -->
          <section class="space-y-2">
            <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected Components</h4>
            <div v-if="getSelectedRules(rule).length > 0" class="rounded-md border overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Name</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Type</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Description</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Counts Toward OT</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="(sr, i) in getSelectedRules(rule)"
                    :key="i"
                    class="hover:bg-muted/30 transition-colors"
                  >
                    <td class="px-3 py-2 text-foreground">{{ sr.name ?? '--' }}</td>
                    <td class="px-3 py-2 text-foreground font-mono text-xs">{{ sr.componentType ?? '--' }}</td>
                    <td class="px-3 py-2 text-muted-foreground max-w-xs truncate" :title="sr.description">
                      {{ sr.description ?? '--' }}
                    </td>
                    <td class="px-3 py-2">
                      <span :class="sr.continueToCountTO ? 'text-primary' : 'text-muted-foreground'">
                        {{ sr.continueToCountTO ? 'Yes' : 'No' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">No selected components.</p>
          </section>

          <!-- Combinations -->
          <section class="space-y-2">
            <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Combinations</h4>
            <div v-if="getCombinations(rule).length > 0" class="rounded-md border overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Component 1</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Component 2</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Gets Paid As</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="(combo, i) in getCombinations(rule)"
                    :key="i"
                    class="hover:bg-muted/30 transition-colors"
                  >
                    <td class="px-3 py-2 text-foreground">{{ formatPair(combo.combinationPair?.[0] ?? {}) }}</td>
                    <td class="px-3 py-2 text-foreground">{{ formatPair(combo.combinationPair?.[1] ?? {}) }}</td>
                    <td class="px-3 py-2 text-foreground">{{ combo.getsPaidAs ?? '--' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">No combinations defined.</p>
          </section>

          <!-- OT Counting Rules -->
          <section class="space-y-2">
            <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">OT Counting Rules</h4>
            <div v-if="getOTRules(rule).length > 0" class="rounded-md border overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-muted/50">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Source Rule</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Source Type</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Target OT Rule</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Target Type</th>
                    <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Counts?</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="(ot, i) in getOTRules(rule)"
                    :key="i"
                    class="hover:bg-muted/30 transition-colors"
                  >
                    <td class="px-3 py-2 text-foreground">
                      {{ ot.sourceRuleName?.qualifier ?? ot.sourceRuleName?.id ?? '--' }}
                    </td>
                    <td class="px-3 py-2 text-foreground font-mono text-xs">{{ ot.sourceRuleComponentType ?? '--' }}</td>
                    <td class="px-3 py-2 text-foreground">{{ ot.targetOTRuleName ?? '--' }}</td>
                    <td class="px-3 py-2 text-foreground font-mono text-xs">{{ ot.targetOTRuleComponentType ?? '--' }}</td>
                    <td class="px-3 py-2">
                      <span :class="ot.countsTowardTargetOT ? 'text-primary' : 'text-muted-foreground'">
                        {{ ot.countsTowardTargetOT ? 'Yes' : 'No' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="text-xs text-muted-foreground italic">No OT counting rules defined.</p>
          </section>

        </div>
      </div>
    </div>
  </div>
</template>
