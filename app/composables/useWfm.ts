export type WfmFlow = 'interactive' | 'non-interactive'

export interface WfmAuthParams {
  flow: WfmFlow
  clientId: string
  clientSecret: string
  orgRealmId: string
  hostname: string
  username?: string
  password?: string
}

export interface WfmInputDef {
  name: string
  type: 'text' | 'date' | 'url'
  label: string
  placeholder?: string
  /** Shown as helper text below the field. */
  description?: string
  required?: boolean
}

export interface WfmEndpointDef {
  id: string
  label: string
  method: 'GET' | 'POST'
  path: string
  description: string
  category: string
  /** Bullet points shown in the documentation panel. */
  notes?: string[]
  /** Declarative input fields rendered generically by EndpointPanel. */
  inputs?: WfmInputDef[]
  /**
   * Body sent automatically when the user clicks Execute and no inputs are filled.
   * Lets POST endpoints work out-of-the-box without exposing JSON to the user.
   */
  defaultBody?: unknown
}

/**
 * Single source of truth for every WFM endpoint the relay supports.
 *
 * To add a new endpoint:
 *   - No inputs:     append one entry — composable, types, and UI update automatically.
 *   - Simple inputs: append one entry with an `inputs` array.
 *   - Complex input: append one entry, then register a custom component in
 *                    EndpointPanel's CUSTOM_INPUT_REGISTRY.
 */
export const ENDPOINT_DEFS = [
  // ── Common Resources ──────────────────────────────────────────────
  {
    id: 'locations',
    label: 'Locations',
    method: 'POST',
    path: 'api/v1/commons/locations/multi_read',
    description: 'Retrieve location records via multi-read.',
    category: 'Common Resources',
    notes: [
      'Retrieves a paginated list of Organizational Map locations.',
      'Use the Qualifier field to scope results to a specific Business Structure node and its descendants.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
    inputs: [
      {
        name: 'qualifier',
        type: 'text',
        label: 'Qualifier',
        placeholder: 'UKG Inc.',
        description: 'Name of the node from the Business Structure to retrieve all descendant nodes of.',
      },
      {
        name: 'date',
        type: 'date',
        label: 'Date',
        description: 'The effective date to search from.',
      },
    ],
  },
  {
    id: 'multi-read',
    label: 'Multi-Read',
    method: 'POST',
    path: 'api/v1/commons/multi_read',
    description: 'Batch multiple API requests into a single call.',
    category: 'Common Resources',
    notes: [
      'Combines multiple API calls into a single request to reduce round-trips.',
      'The request body should contain an array of individual API request objects.',
    ],
  },
  {
    id: 'hyperfind',
    label: 'Hyperfind Queries',
    method: 'GET',
    path: 'api/v1/commons/hyperfind/public',
    description: 'Retrieve public hyperfind query definitions.',
    category: 'Common Resources',
    notes: [
      'Retrieves all public Hyperfind Queries available to the authenticated user.',
      'Uses the API user\'s access rights.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'data-elements',
    label: 'Data Elements',
    method: 'GET',
    path: 'api/v1/commons/data_dictionary/data_elements',
    description: 'Retrieve all data dictionary data elements.',
    category: 'Common Resources',
    notes: [
      'Retrieves all available columns from all available entities.',
      'Provides useful information about columns such as type and access requirements.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'known-ip-addresses',
    label: 'Known IP Addresses',
    method: 'GET',
    path: 'api/v1/commons/known_ip_addresses',
    description: 'Retrieve known IP address records.',
    category: 'Common Resources',
    notes: [
      'Retrieves all Known IP Addresses configured in the system.',
      'The associated Function Access Control Point is SETUP.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },

  // ── People ────────────────────────────────────────────────────────
  {
    id: 'persons-paginated',
    label: 'Persons (Paginated)',
    method: 'POST',
    path: 'api/v1/commons/persons/apply_read',
    description: 'Retrieve the most detailed person records available.',
    category: 'People',
    notes: [
      'Returns the most detailed person response supported by this endpoint.',
      'Retrieves up to 1,000 records per request.',
      'The associated access control point is LIGHT_WEIGHT_EMPLOYEE_RECORDS_READ.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
    defaultBody: { where: {}, index: 0, count: 1000 },
  },

  // ── Labor Categories ──────────────────────────────────────────────
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
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'labor-category-entries',
    label: 'Labor Category Entries',
    method: 'POST',
    path: 'api/v1/commons/labor_entries/multi_read',
    description: 'Retrieve labor category entries via multi-read.',
    category: 'Labor Categories',
    notes: [
      'Retrieves Labor Category Entries from WFM.',
      'Enter a Labor Category Entry Name to retrieve its data.',
      'Only retrieves one entry at a time — use the paginated variant for bulk retrieval.',
    ],
    inputs: [
      {
        name: 'name',
        type: 'text',
        label: 'Labor Category Entry Name',
        placeholder: 'Labor Category Entry Name',
        required: true,
      },
    ],
  },
  {
    id: 'labor-category-entries-paginated',
    label: 'Labor Category Entries (Paginated)',
    method: 'POST',
    path: 'api/v1/commons/labor_entries/apply_read',
    description: 'Retrieve labor category entries with pagination support.',
    category: 'Labor Categories',
    notes: [
      'Retrieves labor category entries from the system.',
      'Select specific Labor Categories to filter results, or leave empty to retrieve all entries.',
      'Selecting fewer categories improves loading time for large datasets.',
      'Large datasets (50k+ records) may take longer to load.',
    ],
    // Rendered via LaborCategorySelect — registered in EndpointPanel's CUSTOM_INPUT_REGISTRY
  },

  // ── Timekeeping ───────────────────────────────────────────────────
  {
    id: 'pay-codes',
    label: 'Pay Codes',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/pay_codes',
    description: 'Retrieve pay code definitions.',
    category: 'Timekeeping',
    notes: [
      'Retrieves all Pay Codes available to the manager.',
      'Uses the API user\'s access rights.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'pay-rules',
    label: 'Pay Rules',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/payrules',
    description: 'Retrieve pay rules configuration.',
    category: 'Timekeeping',
    notes: [
      'Retrieves all Timekeeping Pay Rules.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'adjustment-rules',
    label: 'Adjustment Rules',
    method: 'GET',
    path: 'api/v1/timekeeping/setup/adjustment_rules',
    description: 'Retrieve adjustment rules configuration.',
    category: 'Timekeeping',
    notes: [
      'Retrieves all available Adjustment Rules.',
      'Uses the API user\'s access rights.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'percent-allocation-rules',
    label: 'Percent Allocation Rules',
    method: 'GET',
    path: 'api/v1/timekeeping/setup/percentage_allocation_rules?all_details=true',
    description: 'Retrieve percentage allocation rules with full details.',
    category: 'Timekeeping',
    notes: [
      'Retrieves all Percentage Allocation Rules.',
      'The all_details flag is enabled, returning full rule configuration.',
      'Uses the API user\'s access rights.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },

  // ── Platform ──────────────────────────────────────────────────────
  {
    id: 'scheduled-reports',
    label: 'Scheduled Reports',
    method: 'POST',
    path: 'api/v1/platform/scheduled_reports/apply_read',
    description: 'Retrieve scheduled report definitions with pagination support.',
    category: 'Platform',
    notes: [
      'Retrieves all Scheduled Reporting Jobs.',
      'The associated Access Control Point is REPORT_SCHEDULING with action Allowed.',
      'The output may reference other endpoints to obtain all associated data.',
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
] as const satisfies WfmEndpointDef[]

/** Union of all valid endpoint IDs, derived from the definitions array. */
export type WfmEndpointId = typeof ENDPOINT_DEFS[number]['id']

export function useWfm() {
  /** The flat list of endpoint definitions for UI consumption. */
  const endpoints: WfmEndpointDef[] = [...ENDPOINT_DEFS]

  /**
   * Authenticate with WFM and store the session token in an HTTP-only cookie.
   * Throws a FetchError on failure — catch it to display the error to the user.
   */
  async function authenticate(params: WfmAuthParams): Promise<void> {
    await $fetch('/api/wfm/auth', { method: 'POST', body: params })
  }

  /** Clears the session cookies. */
  async function logout(): Promise<void> {
    await $fetch('/api/wfm/logout', { method: 'POST' })
  }

  /**
   * Make an authenticated call to the WFM API via the server proxy.
   * Resolves the HTTP method and path from ENDPOINT_DEFS using the given id.
   */
  async function call<T = unknown>(id: WfmEndpointId, data?: unknown): Promise<T> {
    const def = ENDPOINT_DEFS.find(e => e.id === id)
    if (!def) throw new Error(`Unknown WFM endpoint: "${id}"`)
    return $fetch<T>('/api/wfm/call', {
      method: 'POST',
      body: { method: def.method, path: def.path, data },
    })
  }

  return { endpoints, authenticate, logout, call }
}
