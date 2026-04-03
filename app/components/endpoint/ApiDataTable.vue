<script setup lang="ts">
import { ChevronDown, ChevronUp, ChevronsUpDown, Download, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Data extraction ────────────────────────────────────────────────────────

/**
 * WFM responses come in many shapes. Try common patterns to find the data array.
 * Returns null if no tabular data can be extracted.
 */
function extractRows(response: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(response)) {
    return response.length > 0 ? response as Record<string, unknown>[] : null
  }
  if (typeof response !== 'object' || response === null) return null

  const obj = response as Record<string, unknown>
  const candidates = ['data', 'items', 'coreProperties', 'results', 'records', 'employees', 'locations']
  for (const key of candidates) {
    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
      return obj[key] as Record<string, unknown>[]
    }
  }
  // Last resort: find the first array-valued key with objects inside
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      return val as Record<string, unknown>[]
    }
  }
  return null
}

/** Keys that typically identify an object — checked in priority order. */
const IDENTITY_KEYS = ['name', 'label', 'qualifier', 'description', 'title', 'id', 'key', 'value', 'type']

/**
 * Picks the most useful fields from a flat object to produce a scannable summary.
 * Returns values joined with ` / ` — e.g. `"1 / Active"`.
 */
function summarizeObject(obj: Record<string, unknown>): string {
  const parts: string[] = []
  // First pass: grab well-known identity fields
  for (const key of IDENTITY_KEYS) {
    if (key in obj && obj[key] !== null && obj[key] !== undefined && typeof obj[key] !== 'object') {
      parts.push(String(obj[key]))
      if (parts.length >= 3) break
    }
  }
  // Fallback: if no identity keys matched, take the first 3 primitive values
  if (parts.length === 0) {
    for (const val of Object.values(obj)) {
      if (val !== null && val !== undefined && typeof val !== 'object') {
        parts.push(String(val))
        if (parts.length >= 3) break
      }
    }
  }
  return parts.length > 0 ? parts.join(' \u00b7 ') : '{...}'
}

/**
 * Format a cell value for display in the table.
 *
 * - Primitives: rendered directly (booleans as Yes/No).
 * - Arrays of primitives: comma-separated list.
 * - Arrays of objects: item count plus a summary of the first item.
 * - Plain objects: summarized via well-known identity keys.
 */
function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '\u2014'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (Array.isArray(value)) {
    if (value.length === 0) return '\u2014'
    // Array of primitives
    if (value.every(v => typeof v !== 'object' || v === null)) {
      return value.map(v => (v === null || v === undefined) ? '\u2014' : String(v)).join(', ')
    }
    // Array of objects
    const first = value[0] as Record<string, unknown>
    const summary = summarizeObject(first)
    if (value.length === 1) return summary
    return `${value.length} items \u00b7 ${summary} \u2026`
  }

  if (typeof value === 'object') {
    return summarizeObject(value as Record<string, unknown>)
  }

  return String(value)
}

/**
 * Produce a tooltip string for a cell value.
 * Primitives use the same display value; objects/arrays get pretty-printed JSON
 * so hovering reveals full detail (the raw JSON panel covers bulk inspection).
 */
function tooltipCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)
  return JSON.stringify(value, null, 2)
}

// ── State ──────────────────────────────────────────────────────────────────

const search = ref('')
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const perPage = ref(25)
const pageSizeOptions = [25, 50, 100]

// ── Derived ────────────────────────────────────────────────────────────────

const rows = computed(() => extractRows(props.response))
const columns = computed(() => {
  if (!rows.value?.length) return []
  // Seed column order from the densest row (most likely to be complete),
  // then add any keys seen elsewhere that it was missing.
  const densest = rows.value.reduce((best, row) =>
    Object.keys(row).length > Object.keys(best).length ? row : best,
  rows.value[0]!)
  const keySet = new Set(Object.keys(densest))
  for (const row of rows.value) {
    for (const key of Object.keys(row)) {
      keySet.add(key)
    }
  }
  return [...keySet]
})

const filtered = computed(() => {
  if (!rows.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return rows.value
  return rows.value.filter(row =>
    Object.values(row).some(v => formatCell(v).toLowerCase().includes(q)),
  )
})

const sorted = computed(() => {
  if (!sortField.value) return filtered.value
  return [...filtered.value].sort((a, b) => {
    const av = String(a[sortField.value] ?? '')
    const bv = String(b[sortField.value] ?? '')
    const cmp = av.localeCompare(bv, undefined, { numeric: true })
    return sortDirection.value === 'asc' ? cmp : -cmp
  })
})

const totalRecords = computed(() => filtered.value.length)
const totalPages = computed(() => Math.ceil(totalRecords.value / perPage.value))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return sorted.value.slice(start, start + perPage.value)
})

// Reset page when search, sort, or page size changes
watch([search, sortField, sortDirection, perPage], () => { currentPage.value = 1 })

// ── Actions ────────────────────────────────────────────────────────────────

function toggleSort(col: string) {
  if (sortField.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortField.value = col
    sortDirection.value = 'asc'
  }
}

function exportCSV() {
  const cols = columns.value
  const data = sorted.value
  if (!cols.length || !data.length) return

  function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const header = cols.map(escapeCSV).join(',')
  const body = data.map(row =>
    cols.map(col => escapeCSV(formatCell(row[col]))).join(','),
  ).join('\n')

  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `wfm-export-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="rows" class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p class="text-sm text-muted-foreground">
        {{ totalRecords.toLocaleString() }} record{{ totalRecords === 1 ? '' : 's' }}
        <template v-if="rows.length !== totalRecords">
          (filtered from {{ rows.length.toLocaleString() }})
        </template>
      </p>
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <Button variant="outline" size="sm" class="flex-1 sm:flex-none" :disabled="sorted.length === 0"
          @click="exportCSV">
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          Export CSV
        </Button>
        <select v-model="perPage"
          class="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Rows per page">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }} / page</option>
        </select>
      </div>
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true" />
        <Input v-model="search" placeholder="Search…" class="pl-8 h-9 text-sm" aria-label="Search results" />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-md border">
      <table class="w-full text-sm">
        <thead class="bg-muted/50">
          <tr>
            <th v-for="col in columns" :key="col"
              class="whitespace-nowrap px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
              @click="toggleSort(col)">
              <span class="inline-flex items-center gap-1">
                {{ col }}
                <ChevronUp v-if="sortField === col && sortDirection === 'asc'" class="h-3 w-3" aria-hidden="true" />
                <ChevronDown v-else-if="sortField === col && sortDirection === 'desc'" class="h-3 w-3"
                  aria-hidden="true" />
                <ChevronsUpDown v-else class="h-3 w-3 opacity-30" aria-hidden="true" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="(row, i) in paginated" :key="i" class="hover:bg-muted/30 transition-colors">
            <td v-for="col in columns" :key="col" class="max-w-xs truncate px-3 py-2 text-foreground"
              :title="tooltipCell(row[col])">
              {{ formatCell(row[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1"
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <div class="flex items-center gap-2">
        <button type="button"
          class="rounded px-3 py-2 min-h-11 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :disabled="currentPage === 1" aria-label="Go to previous page" @click="currentPage--">
          Previous
        </button>
        <button type="button"
          class="rounded px-3 py-2 min-h-11 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :disabled="currentPage === totalPages" aria-label="Go to next page" @click="currentPage++">
          Next
        </button>
      </div>
    </div>
  </div>
</template>
