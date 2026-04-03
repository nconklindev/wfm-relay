import type { WfmEndpointDef } from '../useWfm'

export const COMMON_RESOURCES_ENDPOINTS = [
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
    ],
  },
  {
    id: 'employee-groups',
    label: 'Employee Groups',
    method: 'GET',
    path: 'api/v1/commons/employee_groups',
    description:
      'Retrieve a list of all Employee Groups or returns a single Employee Group by Name',
    category: 'Common Resources',
    notes: [
      'Retrieves all Employee Groups available in the system or a single Employee Group when filtered by Name.',
    ],
    defaultBody: { all_details: true },
    inputs: [
      {
        name: 'name',
        type: 'text',
        label: 'Employee Group Name',
        placeholder: 'Full-Time Employees',
        description:
          'Name of the Employee Group to retrieve. Leave empty to retrieve all Employee Groups.',
      },
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
      "Uses the API user's access rights.",
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
    ],
  },
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
    ],
    inputs: [
      {
        name: 'qualifier',
        type: 'text',
        label: 'Qualifier',
        placeholder: 'UKG Inc.',
        description:
          'Name of the node from the Business Structure to retrieve all descendant nodes of.',
      },
      {
        name: 'date',
        type: 'date',
        label: 'Date',
        description: 'The effective date to search from.',
      },
    ],
  },
] satisfies WfmEndpointDef[]
