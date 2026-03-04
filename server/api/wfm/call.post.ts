/**
 * POST /api/wfm/call
 *
 * Authenticated proxy for WFM API calls. Reads the session token and hostname
 * from cookies set during authentication, then forwards the request to WFM.
 *
 * Body: { method: 'GET' | 'POST', path: string, data?: unknown }
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

  return callWfmApi(token, hostname, body.method, body.path, body.data)
})
