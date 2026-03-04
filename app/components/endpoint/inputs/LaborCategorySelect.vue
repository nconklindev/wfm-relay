<script setup lang="ts">
/**
 * Custom input for the labor-category-entries-paginated endpoint.
 *
 * Pre-fetches labor categories on mount and renders a multi-select. Emits the
 * request body via update:modelValue so EndpointPanel can pass it to call().
 */

const props = defineProps<{ isAuthenticated: boolean }>()

const emit = defineEmits<{
  'update:modelValue': [data: Record<string, unknown>]
}>()

interface LaborCategory {
  id: number | string
  name: string
}

const { call } = useWfm()

const categories = ref<LaborCategory[]>([])
const selectedIds = ref<(number | string)[]>([])
const isLoading = ref(false)
const loadError = ref('')

async function fetchCategories() {
  if (!props.isAuthenticated) return
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await call<unknown>('labor-categories')
    // Handle both array root and common wrapper shapes
    const arr = Array.isArray(res)
      ? res
      : (res as Record<string, unknown>)?.data ?? (res as Record<string, unknown>)?.items ?? []
    categories.value = (arr as Record<string, unknown>[]).map(c => ({
      id: c.id ?? c.laborCategoryId ?? c.qualifier,
      name: String(c.name ?? c.qualifier ?? c.id),
    })) as LaborCategory[]
  }
  catch {
    loadError.value = 'Failed to load labor categories. Your session may have expired.'
  }
  finally {
    isLoading.value = false
  }
}

function removeCategory(id: number | string) {
  selectedIds.value = selectedIds.value.filter(s => s !== id)
}

// Emit the request body whenever selection changes
watch(selectedIds, (ids) => {
  emit('update:modelValue', ids.length
    ? { where: [{ id: 'LABOR_CATEGORY_REF', value: ids }] }
    : {},
  )
}, { deep: true })

// Load categories when the component mounts (or when auth state changes to true)
watch(() => props.isAuthenticated, (authenticated) => {
  if (authenticated) fetchCategories()
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Loading / error states -->
    <div v-if="isLoading" class="text-sm text-muted-foreground">
      Loading labor categories…
    </div>

    <div v-else-if="loadError" class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {{ loadError }}
      <button class="ml-2 underline hover:no-underline min-h-11 py-2" @click="fetchCategories">
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Multi-select -->
      <div class="space-y-1.5">
        <label for="labor-category-select" class="text-sm font-medium">
          Select Labor Categories
        </label>
        <p class="text-xs text-muted-foreground">
          Hold <kbd class="rounded border px-1 font-mono text-xs">Ctrl</kbd> (Windows) or
          <kbd class="rounded border px-1 font-mono text-xs">⌘</kbd> (Mac) to select multiple.
          Leave empty to retrieve all entries.
        </p>
        <select
          id="labor-category-select"
          v-model="selectedIds"
          multiple
          :disabled="!isAuthenticated || categories.length === 0"
          class="min-h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option v-if="categories.length === 0" disabled>
            No categories available
          </option>
          <option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Selected chips -->
      <div v-if="selectedIds.length > 0" class="flex flex-wrap gap-2">
        <span
          v-for="id in selectedIds"
          :key="id"
          class="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {{ categories.find(c => c.id === id)?.name ?? id }}
          <button
            type="button"
            class="ml-0.5 p-1 min-h-7 min-w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :aria-label="`Remove ${categories.find(c => c.id === id)?.name ?? id}`"
            @click="removeCategory(id)"
          >
            ×
          </button>
        </span>
      </div>
    </template>
  </div>
</template>
