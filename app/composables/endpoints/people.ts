import type { WfmEndpointDef } from '../useWfm'

export const PEOPLE_ENDPOINTS = [
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
    ],
    defaultBody: { where: {}, index: 0, count: 1000 },
  },
] satisfies WfmEndpointDef[]
