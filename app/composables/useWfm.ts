import { ENDPOINT_DEFS } from './endpoints/index'

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
  type: 'text' | 'date' | 'url' | 'number'
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
  /**
   * Transforms declarative input field values into the correct request body shape.
   * Use when the API expects a nested structure that buildGenericBody() can't produce.
   * Falls back to defaultBody when the returned value is undefined.
   */
  buildBody?: (formData: Record<string, string>) => unknown
}

export { ENDPOINT_DEFS }

/** Union of all valid endpoint IDs, derived from the definitions array. */
export type WfmEndpointId = (typeof ENDPOINT_DEFS)[number]['id']

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
    const def = ENDPOINT_DEFS.find((e) => e.id === id)
    if (!def) throw new Error(`Unknown WFM endpoint: "${id}"`)
    return $fetch<T>('/api/wfm/call', {
      method: 'POST',
      body: { method: def.method, path: def.path, data },
    })
  }

  return { endpoints, authenticate, logout, call }
}
