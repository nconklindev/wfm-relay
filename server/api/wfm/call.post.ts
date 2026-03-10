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

  const body = await readBody<{
    method: 'GET' | 'POST'
    path: string
    data?: unknown
  }>(event)

  if (!body.method || !body.path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'method and path are required',
    })
  }

  const first = (await callWfmApi(token, hostname, body.method, body.path, body.data)) as Record<
    string,
    unknown
  >

  // Auto-paginate for responses shaped { records: [...] }.
  // totalElements is per-page only, so we fetch sequentially until a short page signals the end.
  if (first && typeof first === 'object' && Array.isArray(first.records)) {
    const requestData = (body.data ?? {}) as Record<string, unknown>
    const count = (requestData.count as number) ?? 1000

    if (first.records.length === count) {
      const allRecords: unknown[] = [...first.records]
      let index = count

      while (true) {
        const page = (await callWfmApi(token, hostname, body.method, body.path, {
          ...requestData,
          index,
          count,
        })) as Record<string, unknown>

        const pageRecords = Array.isArray(page.records) ? page.records : []
        allRecords.push(...pageRecords)

        if (pageRecords.length < count) break
        index += count
      }

      return { ...first, records: allRecords }
    }
  }

  return first
})
