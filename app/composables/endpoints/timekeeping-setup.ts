// Provides endpoint definitions related to Timekeeping Setup
// Endpoints defined in this file may have varying URL structures, but all should have "setup" as part of the path.

import type { WfmEndpointDef } from '#imports'

export const TIMEKEEPING_SETUP_ENDPOINTS: WfmEndpointDef[] = [
  {
    id: 'accrual-codes',
    label: 'Accrual Codes',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/accrual_codes',
    description: 'Retrieve accrual code definitions.',
    category: 'Timekeeping Setup',
    notes: [
      'Retrieves all Accrual Codes available to the manager.',
      "Uses the API user's access rights.",
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
  },
  {
    id: 'accrual-policies',
    label: 'Accrual Policies',
    method: 'POST',
    path: 'api/v1/timekeeping/setup/accrual_policies/multi_read',
    description: 'Retrieve the list of accrual policies with details.',
    category: 'Timekeeping Setup',
    notes: [
      'Retrieves all Accrual Policies available to the manager.',
      "Uses the API user's access rights.",
      'Review the table for at-a-glance information or the raw JSON for additional details.',
    ],
    // This is mistyped in the docs and doesn't work if spelled "accrualPolicies"
    // TROUBLESHOOT: If this endpoint ever breaks, check this
    defaultBody: { where: { accuralPolicies: { qualifiers: ['ACCRUAL POLICY NAME'] } } },
    inputs: [
      {
        name: 'qualifier',
        type: 'text',
        label: 'Accrual Policy Name',
        placeholder: 'Vacation',
        description: 'Name of the Accrual Policy to retrieve. Must provide a value.',
      },
    ],
    buildBody: (formData) =>
      formData.qualifier
        ? { where: { accuralPolicies: { qualifiers: [formData.qualifier] } } }
        : undefined,
  },
  {
    id: 'accrual-profiles',
    label: 'Accrual Profiles',
    method: 'GET',
    path: 'api/v3/timekeeping/setup/accrual_profiles',
    description: "Retrieve a paginated list of accrual profiles according to the user's access.",
    category: 'Timekeeping Setup',
    notes: ['The associated Access Control Point is ACCRUALS_CONFIGURATION'],
  },
  {
    id: 'adjustment-rules',
    label: 'Adjustment Rules',
    method: 'GET',
    path: 'api/v1/timekeeping/setup/adjustment_rules',
    description: 'Retrieve adjustment rules configuration.',
    category: 'Timekeeping Setup',
    notes: ['Retrieves all available Adjustment Rules.', "Uses the API user's access rights."],
  },
  {
    id: 'holidays',
    label: 'Holidays',
    method: 'GET',
    path: 'api/v1/commons/setup/holidays',
    description: 'Retrieve all holiday configurations.',
    category: 'Timekeeping Setup',
    inputs: [
      {
        name: 'year',
        type: 'number',
        label: 'Year',
        placeholder: '2023',
        description: 'The year for which to retrieve holiday configurations.',
      },
    ],
    buildBody: (formData) => ({
      ...(formData.year ? { year: Number(formData.year) } : {}),
      enabled: true,
    }),
    notes: [
      'Retrieves all Holiday configurations available in the system.',
      'Only returns holidays with enabled status set to true.',
      "Uses the API user's access rights.",
    ],
  },
  {
    id: 'pay-codes',
    label: 'Pay Codes',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/pay_codes',
    description: 'Retrieve pay code definitions.',
    category: 'Timekeeping Setup',
    notes: [
      'Retrieves all Pay Codes available to the manager.',
      "Uses the API user's access rights.",
    ],
  },
  {
    id: 'pay-rules',
    label: 'Pay Rules',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/payrules',
    description: 'Retrieve pay rules configuration.',
    category: 'Timekeeping Setup',
    notes: ['Retrieves all Timekeeping Pay Rules.'],
  },
  {
    id: 'percent-allocation-rules',
    label: 'Percent Allocation Rules',
    method: 'GET',
    path: 'api/v1/timekeeping/setup/percentage_allocation_rules',
    description: 'Retrieve percentage allocation rules with full details.',
    category: 'Timekeeping Setup',
    notes: [
      'Retrieves all Percentage Allocation Rules.',
      'The all_details flag is enabled, returning full rule configuration.',
      "Uses the API user's access rights.",
    ],
  },
  // 4/3/2026: This endpoint is incomplete and only returns the name right now
  {
    id: 'deduct-rules',
    label: 'Bonus and Deduction Rules',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/deduct_rules',
    description: 'Retrieve bonus and deduction rules.',
    category: 'Timekeeping Setup',
  },
  {
    id: 'break-rules-gdap-filtered',
    label: 'Break Rules (GDAP Filtered)',
    method: 'GET',
    path: 'api/v2/timekeeping/setup/break_rules',
    description:
      "Retrieve a list of complete break rule definitions filtered by the calling user's GDAP.",
    category: 'Timekeeping Setup',
    notes: [
      'The associated Access Control Point is PAY_RULES.',
      "This endpoint applies an additional filter to the results based on the calling user's GDAP permissions. If the user does not have GDAP permissions for a given rule, that rule will be excluded from the results.",
    ],
  },
  {
    id: 'combination-rules',
    label: 'Combination Rules',
    method: 'GET',
    path: 'api/v1/timekeeping/setup/combination_rules',
    description: 'Retrieve a list of combination rules.',
    category: 'Timekeeping Setup',
    notes: ['The associated Access Control Point is PAYCODE.'],
  },
]
