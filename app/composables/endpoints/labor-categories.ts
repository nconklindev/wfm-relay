import type { WfmEndpointDef } from '../useWfm'

export const LABOR_CATEGORY_ENDPOINTS = [
  {
    id: 'labor-categories',
    label: 'Labor Categories',
    method: 'GET',
    path: 'api/v1/commons/labor_categories',
    description: 'Retrieve all labor category definitions.',
    category: 'Labor Categories',
    notes: [
      'Retrieves all Labor Category definitions available in the system.',
      'Use the results from this endpoint to filter Labor Category Entries.',
    ],
  },
  {
    id: 'labor-category-entries-paginated',
    label: 'Labor Category Entries',
    method: 'POST',
    path: 'api/v1/commons/labor_entries/apply_read',
    description: 'Retrieve labor category entries, optionally filtered by category.',
    category: 'Labor Categories',
    notes: [
      'Retrieves Labor Category Entries from the system.',
      'Select a Labor Category to filter results, or leave empty to retrieve all entries.',
      'Large datasets (50k+ records) may take longer to load.',
    ],
    // Rendered via LaborCategorySelect — registered in EndpointPanel's CUSTOM_INPUT_REGISTRY
  },
] satisfies WfmEndpointDef[]
