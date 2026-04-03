import type { WfmEndpointDef } from '../useWfm'
import { COMMON_RESOURCES_ENDPOINTS } from './common-resources'
import { LABOR_CATEGORY_ENDPOINTS } from './labor-categories'
import { PEOPLE_ENDPOINTS } from './people'
import { PLATFORM_ENDPOINTS } from './platform'
import { TIMEKEEPING_ENDPOINTS } from './timekeeping'
import { TIMEKEEPING_SETUP_ENDPOINTS } from './timekeeping-setup'

/**
 * Single source of truth for every WFM endpoint the relay supports.
 * Definitions are split by category — add new endpoints in the relevant file.
 *
 * The `as const` here (not on individual category files) is what lets TypeScript
 * derive the narrow WfmEndpointId union from the literal id strings.
 *
 * To add a new endpoint:
 *   - No inputs:     append one entry in the relevant category file.
 *   - Simple inputs: append one entry with an `inputs` array.
 *   - Complex input: append one entry, then register a custom component in
 *                    EndpointPanel's CUSTOM_INPUT_REGISTRY.
 */
export const ENDPOINT_DEFS = [
  ...COMMON_RESOURCES_ENDPOINTS,
  ...PEOPLE_ENDPOINTS,
  ...LABOR_CATEGORY_ENDPOINTS,
  ...TIMEKEEPING_ENDPOINTS,
  ...TIMEKEEPING_SETUP_ENDPOINTS,
  ...PLATFORM_ENDPOINTS,
] as const satisfies WfmEndpointDef[]
