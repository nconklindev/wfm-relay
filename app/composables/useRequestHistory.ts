import { useLocalStorage } from '@vueuse/core'

const MAX_ENTRIES = 20

export interface HistoryEntry {
  id: string
  endpointId: string
  endpointLabel: string
  method: string
  path: string
  timestamp: number
  resultCount: number | null
}

/**
 * Composable for managing WFM request history.
 * Persists up to 20 entries in localStorage under `'wfm-request-history'`.
 */
export function useRequestHistory() {
  const history = useLocalStorage<HistoryEntry[]>('wfm-request-history', [])

  function addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
    history.value = [
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
      ...history.value,
    ].slice(0, MAX_ENTRIES)
  }

  function removeEntry(id: string) {
    history.value = history.value.filter(e => e.id !== id)
  }

  function clearHistory() {
    history.value = []
  }

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  }
}
