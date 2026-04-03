import type { WfmEndpointDef } from '../useWfm'

export const PLATFORM_ENDPOINTS = [
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
    ],
  },
] satisfies WfmEndpointDef[]
