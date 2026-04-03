<script setup lang="ts">
/**
 * Custom result display for the employment-terms endpoint.
 *
 * Each employment term may have multiple effective-dated versions.
 * Each version carries profile references, work hour definitions,
 * paycode tables, a contract definition, and minimum wage config.
 * These sub-sections are rendered as tables or key-value grids
 * inside expandable version cards.
 */

import { ChevronDown, ChevronRight, Search } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const props = defineProps<{ response: unknown }>()

// ── Types ───────────────────────────────────────────────────────────────────

interface RefObject {
  id?: number
  qualifier?: string
}

interface PayCodeRef {
  id?: number
  qualifier?: string
  name?: string
}

interface WorkHourDef {
  payCode?: PayCodeRef
  overtimeRule?: string
  amount?: string
  datePattern?: string
  targetAmountType?: string
  useInGenie?: boolean
  useContractShift?: boolean
}

interface TermDurationPaycode {
  payCode?: PayCodeRef
  workRule?: string
}

interface TermDayPaycode {
  payCode?: PayCodeRef
  startTime?: string
  amount?: string
}

interface WorkingDayHours {
  day?: number
  hours?: string
}

interface ContractDefinition {
  hoursPerDay?: string
  hoursPerWeek?: string
  daysPerWeek?: string
  fte?: string
  fteInPercent?: boolean
  weekStartDay?: number
  legalWorkWeek?: number
  workingDaysHours?: WorkingDayHours[]
}

interface MinimumWage {
  amount?: string
  contributingPayCodes?: RefObject
  adjustmentPayCode?: RefObject
}

interface EmploymentTermVersion {
  id?: number
  startDate?: string
  endDate?: string
  accrualProfile?: RefObject
  cascadeProfile?: RefObject
  positionAccrualProfile?: RefObject
  positionCascadeProfile?: RefObject
  timeOffRule?: RefObject
  holidayProfile?: RefObject
  payCodeValuesProfile?: RefObject
  payRule?: RefObject
  workHours?: { workHourDef?: WorkHourDef[] }
  durationPaycodes?: { termDurationPaycode?: TermDurationPaycode[] }
  dayPaycodes?: { termDayPaycode?: TermDayPaycode[] }
  contractDefinition?: ContractDefinition
  minimumWage?: MinimumWage
}

interface EmploymentTerm {
  id?: number
  name?: string
  description?: string
  persistentId?: string
  processType?: string
  allowsInheritance?: boolean
  isActive?: boolean
  versions?: { employmentTermVersion?: EmploymentTermVersion[] }
}

// ── Data extraction ─────────────────────────────────────────────────────────

function extractTerms(response: unknown): EmploymentTerm[] {
  if (Array.isArray(response)) return response as EmploymentTerm[]
  if (typeof response !== 'object' || response === null) return []

  const obj = response as Record<string, unknown>
  for (const key of ['data', 'employmentTerms', 'items', 'results']) {
    if (Array.isArray(obj[key])) return obj[key] as EmploymentTerm[]
  }
  for (const val of Object.values(obj)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
      return val as EmploymentTerm[]
    }
  }
  return []
}

function getVersions(term: EmploymentTerm): EmploymentTermVersion[] {
  return term.versions?.employmentTermVersion ?? []
}

function getSortedVersions(term: EmploymentTerm): EmploymentTermVersion[] {
  return [...getVersions(term)].sort((a, b) =>
    (a.startDate ?? '').localeCompare(b.startDate ?? ''),
  )
}

function formatRef(ref: RefObject | undefined): string {
  if (!ref) return '--'
  if (ref.qualifier) return ref.qualifier
  if (ref.id !== undefined) return String(ref.id)
  return '--'
}

function formatDate(date: string | undefined): string {
  return date ?? '--'
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function formatPayCode(pc: PayCodeRef | undefined): string {
  if (!pc) return '--'
  return pc.name ?? pc.qualifier ?? String(pc.id ?? '--')
}

const DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

function formatDay(day: number | undefined): string {
  if (day === undefined) return '--'
  return DAY_NAMES[day] ?? String(day)
}

// Profile ref fields to display in the references grid
const PROFILE_FIELDS: Array<{ key: keyof EmploymentTermVersion; label: string }> = [
  { key: 'payRule', label: 'Pay Rule' },
  { key: 'accrualProfile', label: 'Accrual Profile' },
  { key: 'cascadeProfile', label: 'Cascade Profile' },
  { key: 'positionAccrualProfile', label: 'Position Accrual Profile' },
  { key: 'positionCascadeProfile', label: 'Position Cascade Profile' },
  { key: 'holidayProfile', label: 'Holiday Profile' },
  { key: 'timeOffRule', label: 'Time Off Rule' },
  { key: 'payCodeValuesProfile', label: 'Pay Code Values Profile' },
]

// ── State ───────────────────────────────────────────────────────────────────

const search = ref('')
const expandedTerms = ref<Set<number | string>>(new Set())
const expandedSections = ref<Set<string>>(new Set())

// ── Derived ─────────────────────────────────────────────────────────────────

const terms = computed(() => extractTerms(props.response))

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return terms.value
  return terms.value.filter(t => t.name?.toLowerCase().includes(q))
})

const totalCount = computed(() => filtered.value.length)

const filteredWithVersions = computed(() =>
  filtered.value.map(term => ({
    term,
    versions: getSortedVersions(term),
  })),
)

const allExpanded = computed(
  () => terms.value.length > 0 && terms.value.every(t => expandedTerms.value.has(t.id ?? t.name ?? '')),
)

// ── Actions ─────────────────────────────────────────────────────────────────

function termKey(term: EmploymentTerm): number | string {
  return term.id ?? term.name ?? ''
}

function toggleTerm(key: number | string) {
  const next = new Set(expandedTerms.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedTerms.value = next
}

function isTermExpanded(key: number | string): boolean {
  return expandedTerms.value.has(key)
}

function expandAll() {
  expandedTerms.value = new Set(terms.value.map(termKey))
}

function collapseAll() {
  expandedTerms.value = new Set()
}

function toggleSection(key: string) {
  const next = new Set(expandedSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedSections.value = next
}

function isSectionExpanded(key: string): boolean {
  return expandedSections.value.has(key)
}
</script>

<template>
  <div v-if="terms.length > 0" class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-muted-foreground">
          {{ totalCount.toLocaleString() }} term{{ totalCount === 1 ? '' : 's' }}
          <template v-if="terms.length !== totalCount">
            (filtered from {{ terms.length.toLocaleString() }})
          </template>
        </p>
        <div class="flex items-center gap-1 text-xs">
          <button type="button"
            class="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="allExpanded" @click="expandAll">
            Expand all
          </button>
          <span class="text-border">·</span>
          <button type="button"
            class="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="expandedTerms.size === 0" @click="collapseAll">
            Collapse all
          </button>
        </div>
      </div>
      <div class="relative w-full sm:w-64">
        <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true" />
        <Input v-model="search" placeholder="Search terms..." class="pl-8 h-9 text-sm"
          aria-label="Search employment terms" />
      </div>
    </div>

    <!-- Term list -->
    <div class="rounded-md border divide-y">
      <div v-for="{ term, versions } in filteredWithVersions" :key="termKey(term)">
        <!-- Term header row -->
        <button type="button"
          class="flex w-full items-center gap-3 px-4 py-3 min-h-11 text-sm transition-colors hover:bg-muted/50"
          :aria-expanded="isTermExpanded(termKey(term))" @click="toggleTerm(termKey(term))">
          <component :is="isTermExpanded(termKey(term)) ? ChevronDown : ChevronRight"
            class="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span class="font-medium text-foreground text-left wrap-break-word min-w-0">{{ term.name ?? '--' }}</span>
          <span v-if="term.isActive === false" class="ml-1 text-xs text-muted-foreground shrink-0"
            aria-label="Inactive">(inactive)</span>
          <Badge variant="secondary" class="ml-auto shrink-0">
            {{ versions.length }} version{{ versions.length === 1 ? '' : 's' }}
          </Badge>
        </button>

        <!-- Expanded: term meta + version cards -->
        <div v-if="isTermExpanded(termKey(term))" class="border-t bg-muted/20 px-3 py-4 space-y-4 sm:px-5">

          <!-- Term-level metadata -->
          <div class="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
            <div v-if="term.description" class="flex flex-col gap-0.5 sm:col-span-2">
              <dt class="text-muted-foreground text-xs">Description</dt>
              <dd class="text-foreground">{{ term.description }}</dd>
            </div>
            <div class="flex flex-col gap-0.5">
              <dt class="text-muted-foreground text-xs">Process Type</dt>
              <dd class="text-foreground font-mono text-xs">{{ term.processType ?? '--' }}</dd>
            </div>
            <div class="flex flex-col gap-0.5">
              <dt class="text-muted-foreground text-xs">Allows Inheritance</dt>
              <dd class="text-foreground">{{ formatPrimitive(term.allowsInheritance) }}</dd>
            </div>
            <div v-if="term.persistentId" class="flex flex-col gap-0.5">
              <dt class="text-muted-foreground text-xs">Persistent ID</dt>
              <dd class="text-foreground font-mono text-xs">{{ term.persistentId }}</dd>
            </div>
          </div>

          <!-- Version cards -->
          <div v-for="(version, vi) in versions" :key="version.id ?? vi"
            class="rounded-lg border bg-background p-4 space-y-4 sm:p-5">
            <!-- Version header -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span class="text-sm font-medium text-foreground">
                Version {{ version.id ?? vi + 1 }}
              </span>
              <span class="text-xs sm:text-sm text-muted-foreground">
                {{ formatDate(version.startDate) }} → {{ formatDate(version.endDate) || 'Forever' }}
              </span>
            </div>

            <!-- Profile references grid -->
            <section class="space-y-2">
              <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profiles &amp; Rules</h4>
              <dl class="grid grid-cols-1 gap-y-1.5 gap-x-6 text-sm sm:grid-cols-2">
                <template v-for="field in PROFILE_FIELDS" :key="field.key">
                  <div v-if="version[field.key]" class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-36">{{ field.label }}</dt>
                    <dd class="text-foreground truncate">{{ formatRef(version[field.key] as RefObject) }}</dd>
                  </div>
                </template>
              </dl>
            </section>

            <!-- Work Hours -->
            <section v-if="(version.workHours?.workHourDef?.length ?? 0) > 0" class="space-y-2">
              <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Work Hours</h4>
              <div class="rounded-md border overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-muted/50">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Pay Code</th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Overtime Rule
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Date Pattern
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Target Amount
                        Type
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Use in Genie
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Use Contract
                        Shift
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="(wh, i) in version.workHours!.workHourDef" :key="i"
                      class="hover:bg-muted/30 transition-colors">
                      <td class="px-3 py-2 text-foreground">{{ formatPayCode(wh.payCode) }}</td>
                      <td class="px-3 py-2 text-foreground">{{ wh.overtimeRule ?? '--' }}</td>
                      <td class="px-3 py-2 text-foreground">{{ wh.amount ?? '--' }}</td>
                      <td class="px-3 py-2 text-foreground font-mono text-xs">{{ wh.datePattern ?? '--' }}</td>
                      <td class="px-3 py-2 text-foreground">{{ wh.targetAmountType ?? '--' }}</td>
                      <td class="px-3 py-2">
                        <span :class="wh.useInGenie ? 'text-primary' : 'text-muted-foreground'">
                          {{ formatPrimitive(wh.useInGenie) }}
                        </span>
                      </td>
                      <td class="px-3 py-2">
                        <span :class="wh.useContractShift ? 'text-primary' : 'text-muted-foreground'">
                          {{ formatPrimitive(wh.useContractShift) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Duration Paycodes -->
            <section v-if="(version.durationPaycodes?.termDurationPaycode?.length ?? 0) > 0" class="space-y-2">
              <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Duration Paycodes</h4>
              <div class="rounded-md border overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-muted/50">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Pay Code</th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Work Rule</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="(dp, i) in version.durationPaycodes!.termDurationPaycode" :key="i"
                      class="hover:bg-muted/30 transition-colors">
                      <td class="px-3 py-2 text-foreground">{{ formatPayCode(dp.payCode) }}</td>
                      <td class="px-3 py-2 text-foreground">{{ dp.workRule ?? '--' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Day Paycodes -->
            <section v-if="(version.dayPaycodes?.termDayPaycode?.length ?? 0) > 0" class="space-y-2">
              <h4 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Day Paycodes</h4>
              <div class="rounded-md border overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-muted/50">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Pay Code</th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Start Time
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    <tr v-for="(dp, i) in version.dayPaycodes!.termDayPaycode" :key="i"
                      class="hover:bg-muted/30 transition-colors">
                      <td class="px-3 py-2 text-foreground">{{ formatPayCode(dp.payCode) }}</td>
                      <td class="px-3 py-2 text-foreground font-mono text-xs">{{ dp.startTime ?? '--' }}</td>
                      <td class="px-3 py-2 text-foreground">{{ dp.amount ?? '--' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Contract Definition -->
            <section v-if="version.contractDefinition" class="space-y-2">
              <button type="button"
                class="flex w-full items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                @click="toggleSection(`${termKey(term)}-${vi}-contract`)">
                <component :is="isSectionExpanded(`${termKey(term)}-${vi}-contract`) ? ChevronDown : ChevronRight"
                  class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Contract Definition
              </button>
              <div v-if="isSectionExpanded(`${termKey(term)}-${vi}-contract`)"
                class="rounded-md border bg-muted/20 p-3 space-y-3">
                <dl class="grid grid-cols-1 gap-y-1.5 gap-x-6 text-sm sm:grid-cols-2">
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">Hours / Day</dt>
                    <dd class="text-foreground">{{ version.contractDefinition.hoursPerDay ?? '--' }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">Hours / Week</dt>
                    <dd class="text-foreground">{{ version.contractDefinition.hoursPerWeek ?? '--' }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">Days / Week</dt>
                    <dd class="text-foreground">{{ version.contractDefinition.daysPerWeek ?? '--' }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">FTE</dt>
                    <dd class="text-foreground">
                      {{ version.contractDefinition.fte ?? '--' }}
                      <span v-if="version.contractDefinition.fteInPercent" class="text-muted-foreground text-xs">(in
                        %)</span>
                    </dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">Week Start Day</dt>
                    <dd class="text-foreground">{{ formatDay(version.contractDefinition.weekStartDay) }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-32">Legal Work Week</dt>
                    <dd class="text-foreground">{{ version.contractDefinition.legalWorkWeek ?? '--' }}</dd>
                  </div>
                </dl>

                <!-- Working Days/Hours sub-table -->
                <div v-if="(version.contractDefinition.workingDaysHours?.length ?? 0) > 0" class="space-y-1.5">
                  <p class="text-xs text-muted-foreground font-medium">Working Days &amp; Hours</p>
                  <div class="rounded-md border overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-muted/50">
                        <tr>
                          <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Day</th>
                          <th class="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Hours</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y">
                        <tr v-for="(wdh, i) in version.contractDefinition.workingDaysHours" :key="i"
                          class="hover:bg-muted/30 transition-colors">
                          <td class="px-3 py-2 text-foreground">{{ formatDay(wdh.day) }}</td>
                          <td class="px-3 py-2 text-foreground">{{ wdh.hours ?? '--' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <!-- Minimum Wage -->
            <section v-if="version.minimumWage" class="space-y-2">
              <button type="button"
                class="flex w-full items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                @click="toggleSection(`${termKey(term)}-${vi}-minwage`)">
                <component :is="isSectionExpanded(`${termKey(term)}-${vi}-minwage`) ? ChevronDown : ChevronRight"
                  class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Minimum Wage
              </button>
              <div v-if="isSectionExpanded(`${termKey(term)}-${vi}-minwage`)" class="rounded-md border bg-muted/20 p-3">
                <dl class="grid grid-cols-1 gap-y-1.5 gap-x-6 text-sm sm:grid-cols-2">
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-40">Amount</dt>
                    <dd class="text-foreground">{{ version.minimumWage.amount ?? '--' }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-40">Contributing Pay Codes</dt>
                    <dd class="text-foreground">{{ formatRef(version.minimumWage.contributingPayCodes) }}</dd>
                  </div>
                  <div class="flex items-baseline gap-2">
                    <dt class="text-muted-foreground shrink-0 text-xs min-w-40">Adjustment Pay Code</dt>
                    <dd class="text-foreground">{{ formatRef(version.minimumWage.adjustmentPayCode) }}</dd>
                  </div>
                </dl>
              </div>
            </section>

          </div>

          <p v-if="versions.length === 0" class="text-xs text-muted-foreground italic">
            No versions found for this term.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
