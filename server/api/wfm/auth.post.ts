/**
 * POST /api/wfm/auth
 *
 * Authenticates with the WFM OAuth2 endpoint and stores the access token in
 * an HTTP-only session cookie. Supports both the interactive (password-realm)
 * and non-interactive (client_credentials) flows.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { flow, clientId, clientSecret, orgRealmId, hostname } = body

  if (!flow || !clientId || !clientSecret || !orgRealmId || !hostname) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (flow === 'interactive' && (!body.username || !body.password)) {
    throw createError({ statusCode: 400, statusMessage: 'Username and password required for interactive flow' })
  }

  const tokenUrl = getTokenUrl(hostname)

  const params: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
    audience: 'https://wfm.ukg.net/api',
    ...(flow === 'interactive'
      ? {
          grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
          username: body.username,
          password: body.password,
          realm: orgRealmId,
        }
      : {
          grant_type: 'client_credentials',
          organization: orgRealmId,
        }),
  }

  try {
    const response = await $fetch<{ access_token: string }>(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
      },
      body: new URLSearchParams(params).toString(),
    })

    setWfmSession(event, response.access_token, hostname)
    return { success: true }
  }
  catch (error) {
    const err = error as { response?: { status: number; _data?: unknown } }
    throw createError({
      statusCode: err.response?.status ?? 502,
      statusMessage: 'Authentication failed',
      data: err.response?._data,
    })
  }
})
