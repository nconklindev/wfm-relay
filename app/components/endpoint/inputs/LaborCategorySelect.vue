<script setup lang="ts">
/**
 * Custom input for the labor-category-entries-paginated endpoint.
 *
 * Pre-fetches labor categories on mount and renders a single-select dropdown.
 * Emits the request body via update:modelValue so EndpointPanel can pass it to call().
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
const selectedId = ref<number | string | ''>('')
const isLoading = ref(false)
const loadError = ref('')

async function fetchCategories() {
  if (!props.isAuthenticated) return
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await call<unknown>('labor-categories')
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

watch(selectedId, (id) => {
  emit('update:modelValue', id !== ''
    ? { where: { laborCategory: { id } } }
    : {},
  )
})

watch(() => props.isAuthenticated, (authenticated) => {
  if (authenticated) fetchCategories()
}, { immediate: true })
</script>

<template>
  <div class="space-y-1.5">
    <label for="labor-category-select" class="text-sm font-medium">
      Labor Category <span class="font-normal text-muted-foreground">(optional)</span>
    </label>
    <p class="text-xs text-muted-foreground">
      Select a category to filter entries, or leave empty to retrieve all.
    </p>

    <div v-if="isLoading" class="text-sm text-muted-foreground">
      Loading labor categories…
    </div>

    <div v-else-if="loadError"
      class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {{ loadError }}
      <button type="button" class="ml-2 underline hover:no-underline min-h-11 py-2" @click="fetchCategories">
        Retry
      </button>
    </div>

    <select v-else id="labor-category-select" v-model="selectedId" :disabled="!isAuthenticated"
      class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
      <option value="">All categories</option>
      <option v-for="cat in categories" :key="cat.id" :value="cat.id">
        {{ cat.name }}
      </option>
    </select>
  </div>
</template>
