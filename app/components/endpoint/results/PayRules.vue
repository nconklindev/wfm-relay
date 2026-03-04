<script setup lang="ts">
/**
 * Custom result display for the pay-rules endpoint.
 *
 * Renders an expandable list of pay rules with their effective-dated versions.
 * Version configuration fields are rendered as a scannable key-value grid,
 * with nested objects shown as collapsible sub-sections since the full schema
 * is not known ahead of time.
 */

import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Types ───────────────────────────────────────────────────────────────────

interface PayRuleVersion {
  versionId?: string | number
  effectiveDate?: string
  expirationDate?: string
  createDate?: string
  [key: string]: unknown
}

interface PayRule {
  id: string | number
  name: string
  payRuleVersions?: {
    payRuleVersion?: PayRuleVersion[]
  }
  versions?: PayRuleVersion[]
  [key: string]: unknown
}

// ── Data extraction ─────────────────────────────────────────────────────────

function extractRules(response: unknown): PayRule[] {
  if (Array.isArray(response)) return response as PayRule[]
  if (typeof response !== 'object' || response === null) return []

  const obj = response as Record<string, unknown>
  for (const key of ['data', 'payRules', 'items', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as PayRule[]
  }
  // Fallback: first array-valued key with objects
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as PayRule[]
    }
  }
  return []
}

function getVersions(rule: PayRule): PayRuleVersion[] {
  // Try the known nested structure first
  if (rule.payRuleVersions?.payRuleVersion) {
    return rule.payRuleVersions.payRuleVersion
  }
  // Try a flat versions array
  if (Array.isArray(rule.versions)) {
    return rule.versions
  }
  // Fallback: find any array-valued key in the rule that looks like versions
  for (const [key, val] of Object.entries(rule)) {
    if (key === 'id' || key === 'name') continue
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as PayRuleVersion[]
    }
    // Handle the { wrapper: [...] } pattern (like payRuleVersions.payRuleVersion)
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      for (const innerVal of Object.values(inner)) {
        if (Array.isArray(innerVal) && innerVal.length > 0 && typeof innerVal[0] === 'object') {
          return innerVal as PayRuleVersion[]
        }
      }
    }
  }
  return []
}

/** Priority-ordered keys used to extract a human-readable label from an object. */
const IDENTITY_KEYS = ['name', 'qualifier', 'label', 'description', 'title', 'id']

/**
 * Extracts a readable label from an array item.
 * Handles direct identity keys and one level of nesting, e.g.:
 *   { holiday: { name: "New Year's Day" }, selected: true } → "New Year's Day"
 */
function summarizeArrayItem(item: unknown): string {
  if (item === null || item === undefined) return ''
  if (typeof item !== 'object') return String(item)
  const obj = item as Record<string, unknown>
  for (const key of IDENTITY_KEYS) {
    if (typeof obj[key] === 'string' || typeof obj[key] === 'number') return String(obj[key])
  }
  // One level of nesting — find the first nested object and check its identity keys
  for (const val of Object.values(obj)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      for (const key of IDENTITY_KEYS) {
        if (typeof inner[key] === 'string' || typeof inner[key] === 'number') return String(inner[key])
      }
    }
  }
  return ''
}

/**
 * Produces a compact inline preview of an array.
 * Items with `selected: false` are excluded from the preview — they appear dimmed when expanded.
 */
function summarizeArrayPreview(arr: unknown[]): string {
  const active = arr.filter(item => {
    if (typeof item === 'object' && item !== null && 'selected' in (item as object)) {
      return (item as Record<string, unknown>).selected !== false
    }
    return true
  })
  if (active.length === 0) return arr.length > 0 ? 'none selected' : 'empty'
  const names = active.map(summarizeArrayItem).filter(Boolean)
  if (names.length === 0) return `${active.length} item${active.length === 1 ? '' : 's'}`
  const preview = names.slice(0, 3).join(', ')
  return names.length > 3 ? `${preview} +${names.length - 3} more` : preview
}

/** Keys shown in the version header, excluded from the config grid. */
const VERSION_META_KEYS = new Set(['versionId', 'effectiveDate', 'expirationDate', 'createDate'])

/** Get the remaining config fields for a version, excluding header metadata. */
function getConfigEntries(version: PayRuleVersion): [string, unknown][] {
  return Object.entries(version).filter(([key]) => !VERSION_META_KEYS.has(key))
}

function formatDate(date: string | undefined): string {
  if (!date) return '--'
  return date
}

/** Subtract one day from a YYYY-MM-DD string using UTC to avoid DST issues. */
function subtractOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().substring(0, 10)
}

/**
 * Returns versions sorted oldest→newest by effectiveDate.
 * Sorting is needed so we can derive end dates from the next version's start date.
 */
function getSortedVersions(rule: PayRule): PayRuleVersion[] {
  return [...getVersions(rule)].sort((a, b) =>
    (a.effectiveDate ?? '').localeCompare(b.effectiveDate ?? ''),
  )
}

/**
 * Derives the display end date for a version at `index` within a sorted array.
 * - Single version, or last version → "Forever"
 * - Otherwise → day before the next version's effective date
 */
function getDisplayEndDate(versions: PayRuleVersion[], index: number): string {
  if (versions.length <= 1 || index === versions.length - 1) return 'Forever'
  const nextDate = versions[index + 1]?.effectiveDate
  if (!nextDate) return 'Forever'
  return subtractOneDay(nextDate)
}

/** Format a primitive value for display. */
function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** Convert a camelCase or snake_case key into a readable label. */
function formatKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Check whether a value is a non-null object (not array). */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Check whether a value is a non-empty array. */
function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0
}

/** Check whether a value is a primitive (string, number, boolean, null, undefined). */
function isPrimitive(value: unknown): boolean {
  return value === null || value === undefined || typeof value !== 'object'
}

// ── State ───────────────────────────────────────────────────────────────────

const search = ref('')
const expandedRules = ref<Set<string | number>>(new Set())
const expandedSections = ref<Set<string>>(new Set())

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

/** Filtered rules paired with their sorted versions, ready for the template. */
const filteredWithVersions = computed(() =>
  filtered.value.map(rule => ({
    rule,
    versions: getSortedVersions(rule),
  })),
)

// ── Actions ─────────────────────────────────────────────────────────────────

function toggleRule(id: string | number) {
  const next = new Set(expandedRules.value)
  if (next.has(id)) {
    next.delete(id)
  }
  else {
    next.add(id)
  }
  expandedRules.value = next
}

function isRuleExpanded(id: string | number): boolean {
  return expandedRules.value.has(id)
}

function expandAll() {
  expandedRules.value = new Set(rules.value.map(r => r.id))
}

function collapseAll() {
  expandedRules.value = new Set()
}

const allExpanded = computed(
  () => rules.value.length > 0 && rules.value.every(r => expandedRules.value.has(r.id)),
)

function toggleSection(sectionKey: string) {
  const next = new Set(expandedSections.value)
  if (next.has(sectionKey)) {
    next.delete(sectionKey)
  }
  else {
    next.add(sectionKey)
  }
  expandedSections.value = next
}

function isSectionExpanded(sectionKey: string): boolean {
  return expandedSections.value.has(sectionKey)
}
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
            :disabled="expandedRules.size === 0"
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
          aria-label="Search pay rules"
        />
      </div>
    </div>

    <!-- Rule list -->
    <div class="rounded-md border divide-y">
      <div
        v-for="{ rule, versions } in filteredWithVersions"
        :key="rule.id"
      >
        <!-- Rule header row -->
        <button
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3 min-h-11 text-sm transition-colors hover:bg-muted/50"
          :aria-expanded="isRuleExpanded(rule.id)"
          @click="toggleRule(rule.id)"
        >
          <component
            :is="isRuleExpanded(rule.id) ? ChevronDown : ChevronRight"
            class="h-5 w-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span class="font-medium text-foreground text-left wrap-break-word min-w-0">{{ rule.name }}</span>
          <Badge variant="secondary" class="ml-auto shrink-0">
            {{ versions.length }} version{{ versions.length === 1 ? '' : 's' }}
          </Badge>
        </button>

        <!-- Expanded: version cards -->
        <div v-if="isRuleExpanded(rule.id)" class="border-t bg-muted/20 px-3 py-4 space-y-4 sm:px-5">
          <div
            v-for="(version, vi) in versions"
            :key="version.versionId ?? vi"
            class="rounded-lg border bg-background p-4 space-y-4 sm:p-5"
          >
            <!-- Version header -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span class="text-sm font-medium text-foreground">
                Version {{ version.versionId ?? vi + 1 }}
              </span>
              <span class="text-xs sm:text-sm text-muted-foreground">
                {{ formatDate(version.effectiveDate) }} → {{ getDisplayEndDate(versions, vi) }}
              </span>
              <span v-if="version.createDate" class="text-xs sm:text-sm text-muted-foreground">
                Created: {{ version.createDate }}
              </span>
            </div>

            <!-- Config fields grid -->
            <div
              v-if="getConfigEntries(version).length > 0"
              class="space-y-3"
            >
              <template v-for="([key, value]) in getConfigEntries(version)" :key="key">
                <!-- Primitive values: render inline -->
                <div
                  v-if="isPrimitive(value)"
                  class="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3"
                >
                  <dt class="text-muted-foreground shrink-0 sm:min-w-[140px]">{{ formatKey(key) }}:</dt>
                  <dd class="text-foreground wrap-break-word min-w-0">{{ formatPrimitive(value) }}</dd>
                </div>

                <!-- Object values: collapsible sub-section -->
                <div
                  v-else-if="isObject(value)"
                  class="rounded-md border bg-muted/30"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2.5 min-h-11 text-sm transition-colors hover:bg-muted/50"
                    @click="toggleSection(`${rule.id}-${vi}-${key}`)"
                  >
                    <component
                      :is="isSectionExpanded(`${rule.id}-${vi}-${key}`) ? ChevronDown : ChevronRight"
                      class="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span class="text-muted-foreground font-medium text-left wrap-break-word min-w-0">{{ formatKey(key) }}</span>
                    <span class="ml-2 text-xs text-foreground truncate min-w-0">
                      {{ summarizeArrayItem(value) }}
                    </span>
                  </button>
                  <div
                    v-if="isSectionExpanded(`${rule.id}-${vi}-${key}`)"
                    class="border-t px-3 py-3 space-y-2.5"
                  >
                    <template v-for="([subKey, subVal]) in Object.entries(value as Record<string, unknown>)" :key="subKey">
                      <div v-if="isPrimitive(subVal)" class="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3">
                        <dt class="text-muted-foreground shrink-0 sm:min-w-[120px]">{{ formatKey(subKey) }}:</dt>
                        <dd class="text-foreground wrap-break-word min-w-0">{{ formatPrimitive(subVal) }}</dd>
                      </div>
                      <div v-else class="text-sm">
                        <span class="text-muted-foreground">{{ formatKey(subKey) }}:</span>
                        <pre class="mt-1.5 max-h-40 overflow-auto rounded border bg-background p-2.5 font-mono text-xs leading-relaxed text-foreground">{{ JSON.stringify(subVal, null, 2) }}</pre>
                      </div>
                    </template>
                  </div>
                </div>

                <!-- Array values: collapsible with inline name preview -->
                <div
                  v-else-if="isNonEmptyArray(value)"
                  class="rounded-md border bg-muted/30"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-2.5 min-h-11 text-sm transition-colors hover:bg-muted/50"
                    @click="toggleSection(`${rule.id}-${vi}-${key}`)"
                  >
                    <component
                      :is="isSectionExpanded(`${rule.id}-${vi}-${key}`) ? ChevronDown : ChevronRight"
                      class="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span class="text-muted-foreground font-medium shrink-0">{{ formatKey(key) }}</span>
                    <span class="ml-2 text-xs text-foreground truncate min-w-0">
                      {{ summarizeArrayPreview(value as unknown[]) }}
                    </span>
                  </button>
                  <div
                    v-if="isSectionExpanded(`${rule.id}-${vi}-${key}`)"
                    class="border-t px-3 py-3 space-y-1"
                  >
                    <div
                      v-for="(item, itemIdx) in (value as unknown[])"
                      :key="itemIdx"
                      class="flex items-center gap-2 text-xs py-0.5"
                      :class="(item as Record<string, unknown>)?.selected === false ? 'opacity-40' : ''"
                    >
                      <span class="text-foreground">
                        {{ summarizeArrayItem(item) || JSON.stringify(item) }}
                      </span>
                      <span
                        v-if="(item as Record<string, unknown>)?.selected === false"
                        class="text-muted-foreground"
                      >(not selected)</span>
                    </div>
                  </div>
                </div>

                <!-- Empty array -->
                <div
                  v-else-if="Array.isArray(value) && value.length === 0"
                  class="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3"
                >
                  <dt class="text-muted-foreground shrink-0 sm:min-w-[140px]">{{ formatKey(key) }}:</dt>
                  <dd class="text-muted-foreground italic">Empty</dd>
                </div>
              </template>
            </div>

            <!-- No config fields -->
            <p
              v-else
              class="text-xs text-muted-foreground italic"
            >
              No additional configuration for this version.
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
