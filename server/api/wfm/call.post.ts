/**
 * POST /api/wfm/call
 *
 * Authenticated proxy for WFM API calls. Reads the session token and hostname
 * from cookies set during authentication, then forwards the request to WFM.
 *
 * Body: { method: 'GET' | 'POST', path: string, data?: unknown }
 *
 * Auto-pagination: if the response contains `records` and `totalElements`,
 * remaining pages are fetched in parallel and merged into a single response.
 */
export default defineEventHandler(async (event) => {
  const { token, hostname } = getWfmSession(event)

  if (!token || !hostname) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const body = await readBody<{ method: 'GET' | 'POST'; path: string; data?: unknown }>(event)

  if (!body.method || !body.path) {
    throw createError({ statusCode: 400, statusMessage: 'method and path are required' })
  }

  const first = await callWfmApi(token, hostname, body.method, body.path, body.data) as Record<string, unknown>

  // Auto-paginate for any response shaped { records: [...], totalElements: "N" }
  if (
    first
    && typeof first === 'object'
    && Array.isArray(first.records)
    && 'totalElements' in first
  ) {
    const total = parseInt(String(first.totalElements), 10)
    const requestData = (body.data ?? {}) as Record<string, unknown>
    const count = (requestData.count as number) ?? 1000

    if (!isNaN(total) && total > first.records.length) {
      const fetched = first.records.length
      const remainingPages = Math.ceil((total - fetched) / count)

      const pages = await Promise.all(
        Array.from({ length: remainingPages }, (_, i) =>
          callWfmApi(token, hostname, body.method, body.path, {
            ...requestData,
            index: fetched + i * count,
            count,
          }) as Promise<Record<string, unknown>>,
        ),
      )

      const allRecords = [
        ...first.records,
        ...pages.flatMap(p => Array.isArray(p.records) ? p.records : []),
      ]

      return { ...first, records: allRecords, totalElements: String(allRecords.length) }
    }
  }

  return first
})
